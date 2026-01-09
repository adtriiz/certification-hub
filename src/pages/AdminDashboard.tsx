import { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { RefreshCw, Check, X, ShieldAlert, ArrowLeft, Loader2, Users, FileText, Activity, TrendingUp, DollarSign, Calendar, AlertCircle } from "lucide-react";
import { parseNameFromEmail } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, LineChart, Line
} from 'recharts';

interface ChartData {
    date: string;
    [key: string]: string | number;
}

interface DashboardStats {
    users: number;
    completed: number;
    total_certs: number;
    approved_funding: number;
    pending_value: number;
    approval_rate: number;
    fundingEvolution: ChartData[];
    volumeEvolution: ChartData[];
    approvalTrend: ChartData[];
}

interface Application {
    id: string;
    user_id: string;
    certification_id: string;
    status: 'pending' | 'approved' | 'rejected';
    estimated_cost: number;
    reason: string;
    created_at: string;
    profiles?: { email: string };
    certifications?: { certification_name: string };
    prevApprovals: number;
}

interface UserProfile {
    id: string;
    email: string;
    totalApps: number;
    approvedApps: number;
    totalFunding: number;
    applications?: {
        status: string;
        estimated_cost: number;
        certifications?: { certification_name: string }
    }[];
}

const AdminDashboard = () => {
    const { session, isAdmin, loading: authLoading, adminLoading } = useAuth();
    const navigate = useNavigate();
    const [sheetId, setSheetId] = useState("");
    const [sheetName, setSheetName] = useState("");
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [fundingView, setFundingView] = useState<'cumulative' | 'periodic'>('cumulative');
    const [stats, setStats] = useState<DashboardStats>({
        users: 0,
        completed: 0,
        total_certs: 0,
        approved_funding: 0,
        pending_value: 0,
        approval_rate: 0,
        fundingEvolution: [],
        volumeEvolution: [],
        approvalTrend: []
    });
    const [applications, setApplications] = useState<Application[]>([]);
    const [approvedApplications, setApprovedApplications] = useState<Application[]>([]);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [reversingApp, setReversingApp] = useState<{ id: string, status: 'pending' | 'rejected' } | null>(null);

    useEffect(() => {
        if (!authLoading && !adminLoading && !isAdmin) {
            toast.error("Unauthorized access");
            navigate("/");
        }
    }, [authLoading, adminLoading, isAdmin, navigate]);

    useEffect(() => {
        if (isAdmin) {
            fetchStats();
            fetchApplications();
            fetchApprovedApplications();
            fetchUsers();
            fetchSettings();
        }
    }, [isAdmin]);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('admin_settings')
                .select('*');

            if (error) {
                console.error("Error fetching settings:", error);
                return;
            }

            if (data) {
                const sheetIdSetting = data.find(s => s.key === 'google_sheet_id');
                const sheetTabSetting = data.find(s => s.key === 'google_sheet_tab');
                const lastSyncSetting = data.find(s => s.key === 'last_sync_timestamp');

                if (sheetIdSetting) setSheetId(sheetIdSetting.value);
                if (sheetTabSetting) setSheetName(sheetTabSetting.value);
                if (lastSyncSetting) setLastSync(lastSyncSetting.value);
            }
        } catch (error) {
            console.error("Failed to load settings", error);
        }
    };

    const saveSettings = async (id: string, tab: string, updateSyncTime = false) => {
        try {
            const updates = [
                { key: 'google_sheet_id', value: id },
                { key: 'google_sheet_tab', value: tab }
            ];

            if (updateSyncTime) {
                updates.push({ key: 'last_sync_timestamp', value: new Date().toLocaleString() });
                setLastSync(new Date().toLocaleString());
            }

            const { error } = await supabase
                .from('admin_settings')
                .upsert(updates);

            if (error) console.error("Failed to save settings:", error);
        } catch (error) {
            console.error("Error saving settings:", error);
        }
    };

    const fetchStats = async () => {
        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: completedCount } = await supabase.from('user_certifications').select('*', { count: 'exact', head: true }).eq('status', 'completed');
        const { count: certsCount } = await supabase.from('certifications').select('*', { count: 'exact', head: true });

        const { data: allApps } = await supabase
            .from('applications')
            .select('status, estimated_cost, created_at')
            .order('created_at', { ascending: true });

        let approvedFunding = 0;
        let pendingValue = 0;
        let approvedCount = 0;
        let rejectedCount = 0;

        const getMonday = (date: Date) => {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d.setDate(diff));
            monday.setHours(0, 0, 0, 0);
            return monday;
        };

        const weekMap = new Map<string, { funding: number, count: number, approved: number, rejected: number }>();

        if (allApps && allApps.length > 0) {
            // Pre-fill weeks for continuity
            const firstDate = getMonday(new Date(allApps[0].created_at));
            const lastDate = getMonday(new Date()); // Up to today

            const curr = new Date(firstDate);
            while (curr <= lastDate) {
                const key = curr.toISOString().split('T')[0];
                weekMap.set(key, { funding: 0, count: 0, approved: 0, rejected: 0 });
                curr.setDate(curr.getDate() + 7);
            }

            allApps.forEach(app => {
                const cost = Number(app.estimated_cost) || 0;
                const d = new Date(app.created_at);
                const mon = getMonday(d);
                const dateKey = mon.toISOString().split('T')[0];

                if (weekMap.has(dateKey)) {
                    const current = weekMap.get(dateKey)!;
                    current.count += 1;
                    if (app.status === 'approved') {
                        approvedFunding += cost;
                        approvedCount++;
                        current.funding += cost;
                        current.approved += 1;
                    } else if (app.status === 'pending') {
                        pendingValue += cost;
                    } else if (app.status === 'rejected') {
                        rejectedCount++;
                        current.rejected += 1;
                    }
                }
            });
        }

        const fundingEvolution: ChartData[] = [];
        const volumeEvolution: ChartData[] = [];
        const approvalTrend: ChartData[] = [];

        const sortedKeys = Array.from(weekMap.keys()).sort();
        let cumulativeFunding = 0;

        sortedKeys.forEach(key => {
            const data = weekMap.get(key)!;
            const displayDate = new Date(key).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

            cumulativeFunding += data.funding;
            fundingEvolution.push({
                date: displayDate,
                amount: data.funding,
                cumulativeAmount: cumulativeFunding
            });
            volumeEvolution.push({ date: displayDate, requests: data.count });
            approvalTrend.push({
                date: displayDate,
                rate: data.approved + data.rejected > 0
                    ? (data.approved / (data.approved + data.rejected)) * 100
                    : 100
            });
        });

        const totalDecided = approvedCount + rejectedCount;
        const rate = totalDecided > 0 ? (approvedCount / totalDecided) * 100 : 0;

        setStats({
            users: userCount || 0,
            completed: completedCount || 0,
            total_certs: certsCount || 0,
            approved_funding: approvedFunding,
            pending_value: pendingValue,
            approval_rate: rate,
            fundingEvolution,
            volumeEvolution,
            approvalTrend
        });
    };

    const fetchApplications = async () => {
        const { data: apps } = await supabase
            .from('applications')
            .select('*, profiles(email), certifications(certification_name)')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (apps) {
            const userIds = Array.from(new Set(apps.map(a => a.user_id)));
            const { data: prevApps } = await supabase
                .from('applications')
                .select('user_id, status')
                .in('user_id', userIds)
                .eq('status', 'approved');

            const approvalCounts: Record<string, number> = {};
            prevApps?.forEach(pa => {
                approvalCounts[pa.user_id] = (approvalCounts[pa.user_id] || 0) + 1;
            });

            const enrichedApps: Application[] = apps.map(app => ({
                ...app,
                prevApprovals: approvalCounts[app.user_id] || 0
            }));

            setApplications(enrichedApps);
        }
    };

    const fetchApprovedApplications = async () => {
        const { data: apps } = await supabase
            .from('applications')
            .select('*, profiles(email), certifications(certification_name)')
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

        if (apps) {
            setApprovedApplications(apps as Application[]);
        }
    };

    const fetchUsers = async () => {
        const { data: users } = await supabase
            .from('profiles')
            .select('*, applications(status, estimated_cost, certifications(certification_name))');

        if (users) {
            const enrichedUsers: UserProfile[] = (users as unknown as {
                id: string;
                email: string;
                applications: {
                    status: string;
                    estimated_cost: number;
                    certifications: { certification_name: string }
                }[]
            }[]).map(u => {
                const userApps = u.applications || [];
                return {
                    ...u,
                    totalApps: userApps.length,
                    approvedApps: userApps.filter(a => a.status === 'approved').length,
                    totalFunding: userApps
                        .filter(a => a.status === 'approved')
                        .reduce((sum, a) => sum + (Number(a.estimated_cost) || 0), 0)
                };
            });
            setAllUsers(enrichedUsers);
        }
    };

    const handleSync = async () => {
        const cleanSheetId = sheetId.trim();
        const cleanSheetName = sheetName.trim();

        if (!cleanSheetId) {
            toast.error("Please enter a Google Sheet ID");
            return;
        }
        setSyncing(true);
        saveSettings(cleanSheetId, cleanSheetName);

        try {
            if (!session?.provider_token) {
                throw new Error("No Google Access Token found. Please click 'Authorize Sheets Access' above.");
            }

            let finalRange = 'A:Z';
            if (cleanSheetName) {
                const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${cleanSheetId}?fields=sheets.properties`;
                const metaResponse = await fetch(metaUrl, {
                    headers: { Authorization: `Bearer ${session.provider_token}` },
                });

                if (!metaResponse.ok) {
                    const status = metaResponse.status;
                    if (status === 401 || status === 403) throw new Error("AUTH_REQUIRED");
                    if (status === 404) throw new Error("Spreadsheet not found. Check ID.");
                    throw new Error(`Metadata Error: ${status}`);
                }

                const metaData = await metaResponse.json();
                const matchingSheet = metaData.sheets.find((s: { properties: { sheetId: number | string, title: string } }) => s.properties.sheetId.toString() === cleanSheetName);

                if (matchingSheet) {
                    finalRange = `'${matchingSheet.properties.title}'!A:Z`;
                } else {
                    finalRange = `'${cleanSheetName}'!A:Z`;
                }
            }

            const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${cleanSheetId}/values/${finalRange}`;
            const response = await fetch(valuesUrl, {
                headers: { Authorization: `Bearer ${session.provider_token}` },
            });

            if (!response.ok) {
                const status = response.status;
                if (status === 401 || status === 403) throw new Error("AUTH_REQUIRED");
                const errText = await response.text();
                const errorJson = JSON.parse(errText);
                throw new Error(errorJson.error?.message || "Sheets API Error");
            }

            const data = await response.json();
            const rows = data.values;

            if (!rows || rows.length < 2) throw new Error("No data found in sheet");

            const headers = rows[0].map((h: string) => h.toLowerCase().trim());
            const getIndex = (keys: string[]) => headers.findIndex((h: string) => keys.some(k => h.includes(k)));

            const idxName = getIndex(["certification name", "name"]);
            const idxDomain = getIndex(["domain", "area"]);
            const idxTech = getIndex(["technology", "language", "framework"]);
            const idxLevel = getIndex(["experience level", "level"]);
            const idxQuality = getIndex(["quality"]);
            const idxUrl = getIndex(["url"]);
            const idxProvider = getIndex(["provider"]);
            const idxPrice = getIndex(["price"]);
            const idxPriceEur = headers.findIndex((h: string) => h.includes("price") && h.includes("eur"));
            const idxCurrency = getIndex(["currency"]);
            const idxLastChecked = getIndex(["last checked", "checked"]);
            const idxNotes = getIndex(["notes"]);

            if (idxName === -1) throw new Error("Could not find 'Certification Name' column");

            const certificationsToUpsert = rows.slice(1).map((row: string[]) => {
                const getVal = (idx: number) => (idx !== -1 && row[idx]) ? row[idx].trim() : "";
                const parsePrice = (val: string) => val ? (parseFloat(val.replace(/[^\d.-]/g, '')) || 0) : 0;

                return {
                    certification_name: getVal(idxName) || "Unknown",
                    domain: getVal(idxDomain) || "Other",
                    language_framework: getVal(idxTech),
                    url: getVal(idxUrl),
                    provider: getVal(idxProvider),
                    price: parsePrice(getVal(idxPrice)),
                    currency: getVal(idxCurrency) || "USD",
                    experience_level: getVal(idxLevel),
                    certificate_quality: getVal(idxQuality),
                    last_checked: getVal(idxLastChecked) ? new Date(getVal(idxLastChecked)).toISOString() : new Date().toISOString(),
                    notes: getVal(idxNotes),
                    price_in_eur: parsePrice(getVal(idxPriceEur))
                };
            }).filter((c) => c.certification_name && c.certification_name !== "Unknown");

            for (const cert of certificationsToUpsert) {
                const { data: existing } = await supabase.from('certifications').select('id').eq('certification_name', cert.certification_name).maybeSingle();
                if (existing) {
                    await supabase.from('certifications').update(cert).eq('id', existing.id);
                } else {
                    await supabase.from('certifications').insert(cert);
                }
            }

            toast.success(`Success! Synced ${certificationsToUpsert.length} certifications.`);
            saveSettings(cleanSheetId, cleanSheetName, true);
            fetchStats();
        } catch (error: unknown) {
            console.error("SYNC FATAL ERROR:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to sync";
            if (errorMessage === "AUTH_REQUIRED") {
                toast.error("Auth Token Missing/Invalid. Please CLICK 'Authorize Sheets Access' button.");
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setSyncing(false);
        }
    };

    const { linkGoogleSheets } = useAuth();

    const updateApplicationStatus = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
        const { error } = await supabase.from('applications').update({ status }).eq('id', id);
        if (error) {
            toast.error("Failed to update status");
        } else {
            toast.success(`Application ${status}`);
            fetchApplications();
            fetchApprovedApplications();
            fetchStats();
            fetchUsers();
        }
    };

    if (authLoading || adminLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-background relative overflow-x-hidden">
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary/50 via-background to-background pointer-events-none" />
            <div className="relative container mx-auto p-6 space-y-8 max-w-7xl animate-fade-up">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2">
                    <div className="flex items-center gap-5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-warm shrink-0">
                            <ShieldAlert className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">Admin Dashboard</h1>
                            <p className="text-muted-foreground">Manage certifications and team performance.</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/home")}
                        className="gap-2 bg-card/50 backdrop-blur-sm border border-border/60 hover-lift shadow-soft"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Portal
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-up animate-stagger-1">
                    {[
                        { label: "Total Users", val: stats.users, icon: Users, color: "text-blue-600", bg: "bg-blue-50/50" },
                        { label: "Approved Funding", val: `${stats.approved_funding.toLocaleString()}€`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50/50" },
                        { label: "Pending Value", val: `${stats.pending_value.toLocaleString()}€`, icon: Activity, color: "text-amber-600", bg: "bg-amber-50/50" },
                        { label: "Approval Rate", val: `${stats.approval_rate.toFixed(1)}%`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50/50" },
                    ].map((m, i) => (
                        <Card key={i} className="border-border/60 bg-card/80 backdrop-blur-sm shadow-soft hover-lift group overflow-hidden">
                            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full ${m.bg} opacity-50 group-hover:scale-110 transition-transform duration-500`} />
                            <CardHeader className="relative pb-2 flex flex-row items-center justify-between space-y-0 text-muted-foreground">
                                <CardDescription className="font-semibold text-xs uppercase tracking-wider">{m.label}</CardDescription>
                                <m.icon className={`h-4 w-4 ${m.color}`} />
                            </CardHeader>
                            <CardContent className="relative">
                                <div className="text-3xl font-bold tracking-tight">{m.val}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Tabs defaultValue="applications" className="w-full space-y-8 animate-fade-up animate-stagger-2">
                    <TabsList className="bg-card/80 backdrop-blur-sm border border-border/60 p-1 shadow-soft lg:w-fit">
                        <TabsTrigger value="applications" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all px-6 py-2">
                            <FileText className="h-4 w-4" /> Funding Requests
                        </TabsTrigger>
                        <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all px-6 py-2">
                            <Users className="h-4 w-4" /> User Analytics
                        </TabsTrigger>
                        <TabsTrigger value="sync" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all px-6 py-2">
                            <RefreshCw className="h-4 w-4" /> Sync Data
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="applications" className="space-y-6">
                        <Card className="shadow-soft border-border/60 bg-card/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-xl">Pending Applications</CardTitle>
                                <CardDescription>Review and manage funding requests from users.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {applications.length === 0 ? (
                                    <div className="text-center py-16 border-2 border-dashed border-border/60 rounded-xl bg-zinc-50/30 dark:bg-zinc-900/30">
                                        <p className="text-muted-foreground flex items-center justify-center gap-2">
                                            <Check className="h-5 w-5 text-green-500" /> All applications reviewed.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-border/60 overflow-hidden shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-secondary/50 dark:bg-zinc-900/50">
                                                <TableRow>
                                                    <TableHead className="py-4 font-bold">User</TableHead>
                                                    <TableHead className="py-4 font-bold">Certification</TableHead>
                                                    <TableHead className="py-4 font-bold text-center">Prev. Approved</TableHead>
                                                    <TableHead className="py-4 font-bold">Estimated Cost</TableHead>
                                                    <TableHead className="py-4 font-bold max-w-[200px]">Reason</TableHead>
                                                    <TableHead className="py-4 font-bold">Date</TableHead>
                                                    <TableHead className="py-4 text-right font-bold pr-6">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {applications.map((app) => (
                                                    <TableRow key={app.id} className="hover:bg-secondary/30 transition-colors">
                                                        <TableCell className="py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-foreground">{parseNameFromEmail(app.profiles?.email)}</span>
                                                                <span className="text-xs text-muted-foreground">{app.profiles?.email}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4 font-medium">{app.certifications?.certification_name}</TableCell>
                                                        <TableCell className="py-4 text-center">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${app.prevApprovals > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}>
                                                                {app.prevApprovals}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="py-4 font-bold text-primary">{app.estimated_cost}€</TableCell>
                                                        <TableCell className="py-4 max-w-[200px] truncate" title={app.reason}>{app.reason}</TableCell>
                                                        <TableCell className="py-4 text-muted-foreground font-mono text-xs">
                                                            {new Date(app.created_at).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="py-4 text-right pr-6">
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    size="icon"
                                                                    variant="outline"
                                                                    className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-50 shadow-sm"
                                                                    onClick={() => updateApplicationStatus(app.id, 'approved')}
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="outline"
                                                                    className="h-8 w-8 text-destructive border-destructive/20 hover:bg-destructive/5 shadow-sm"
                                                                    onClick={() => updateApplicationStatus(app.id, 'rejected')}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="users" className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card className="shadow-soft border-border/60 bg-card/80 backdrop-blur-sm p-6 overflow-hidden">
                                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-green-600" /> Funding Evolution
                                        </h3>
                                        <p className="text-xs text-muted-foreground">{fundingView === 'cumulative' ? 'Cumulative approved funding' : 'Periodic (weekly) approved funding'} (€)</p>
                                    </div>
                                    <div className="flex bg-secondary/50 p-1 rounded-lg border border-border/40">
                                        <button
                                            onClick={() => setFundingView('cumulative')}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${fundingView === 'cumulative' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            Cumulative
                                        </button>
                                        <button
                                            onClick={() => setFundingView('periodic')}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${fundingView === 'periodic' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            Weekly
                                        </button>
                                    </div>
                                </div>
                                <div className="h-[250px] w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={stats.fundingEvolution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                            <defs>
                                                <linearGradient id="colorFunding" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748B' }} dy={10} interval="preserveStartEnd" />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}
                                                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                                                formatter={(value: number) => [`${value.toLocaleString()}€`, fundingView === 'cumulative' ? 'Cumulative Funding' : 'Weekly Funding']}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey={fundingView === 'cumulative' ? "cumulativeAmount" : "amount"}
                                                stroke="hsl(var(--primary))"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorFunding)"
                                                animationDuration={1000}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            <div className="grid grid-cols-1 gap-8">
                                <Card className="shadow-soft border-border/60 bg-card/80 backdrop-blur-sm p-6">
                                    <div className="mb-6">
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            <Activity className="h-5 w-5 text-blue-600" /> Application Volume
                                        </h3>
                                        <p className="text-xs text-muted-foreground">Flow of requests over time</p>
                                    </div>
                                    <div className="h-[150px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stats.volumeEvolution} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748B' }} dy={10} interval="preserveStartEnd" />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                                                <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>

                                <Card className="shadow-soft border-border/60 bg-card/80 backdrop-blur-sm p-6">
                                    <div className="mb-6 flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <TrendingUp className="h-5 w-5 text-purple-600" /> Approval Consistency
                                            </h3>
                                            <p className="text-xs text-muted-foreground">Historical approval rate percentage</p>
                                        </div>
                                        <div className="text-2xl font-bold text-purple-600">{stats.approval_rate.toFixed(1)}%</div>
                                    </div>
                                    <div className="h-[80px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={stats.approvalTrend} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
                                                <XAxis dataKey="date" hide />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}
                                                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Approval Rate']}
                                                />
                                                <Line type="monotone" dataKey="rate" stroke="#9333ea" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                            </div>
                        </div>

                        <Card className="shadow-soft border-border/60 bg-card/80 backdrop-blur-sm">
                            <CardHeader className="pb-6">
                                <CardTitle className="text-xl">User Activity Directory</CardTitle>
                                <CardDescription>Comprehensive overview of team certification engagement.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-xl border border-border/60 overflow-hidden shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-secondary/50 dark:bg-zinc-900/50">
                                            <TableRow>
                                                <TableHead className="py-4 font-bold">Member</TableHead>
                                                <TableHead className="py-4 font-bold text-center">Requests</TableHead>
                                                <TableHead className="py-4 font-bold text-center">Approved</TableHead>
                                                <TableHead className="py-4 text-right font-bold pr-6">Total Funding Used</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {allUsers.map((u) => (
                                                <TableRow key={u.id} className="hover:bg-secondary/30 transition-colors">
                                                    <TableCell className="py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-foreground tracking-tight">{parseNameFromEmail(u.email)}</span>
                                                            <span className="text-xs text-muted-foreground">{u.email}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 text-center font-medium">{u.totalApps}</TableCell>
                                                    <TableCell className="py-4 text-center">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${u.approvedApps > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-zinc-100 text-muted-foreground'}`}>
                                                            {u.approvedApps}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-4 text-right pr-6">
                                                        <div className="flex items-center justify-end gap-4">
                                                            <span className="font-bold text-primary">{u.totalFunding.toLocaleString()}€</span>
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all rounded-lg">
                                                                        <Activity className="h-3.5 w-3.5" /> Details
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-border/60 shadow-2xl rounded-2xl">
                                                                    <DialogHeader>
                                                                        <DialogTitle className="text-xl font-bold font-display">Approved Certifications</DialogTitle>
                                                                        <DialogDescription className="text-muted-foreground">Detailed list of funding approvals for {parseNameFromEmail(u.email)}</DialogDescription>
                                                                    </DialogHeader>
                                                                    <div className="space-y-4 pt-6">
                                                                        {u.applications?.filter(a => a.status === 'approved').length === 0 ? (
                                                                            <div className="text-center py-10 bg-secondary/20 rounded-xl border border-dashed border-border/40">
                                                                                <p className="text-sm text-muted-foreground">No approved certifications yet.</p>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20">
                                                                                {u.applications?.filter(a => a.status === 'approved').map((app, idx) => (
                                                                                    <div key={idx} className="flex justify-between items-center p-4 rounded-xl bg-secondary/30 border border-border/40 hover:border-primary/30 transition-colors group">
                                                                                        <div className="flex flex-col gap-1">
                                                                                            <span className="font-semibold text-sm group-hover:text-primary transition-colors">{app.certifications?.certification_name}</span>
                                                                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Approved Request</span>
                                                                                        </div>
                                                                                        <div className="flex flex-col items-end">
                                                                                            <span className="font-bold text-primary text-base">{app.estimated_cost}€</span>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                                <div className="pt-4 mt-2 border-t border-border/40 flex justify-between items-center px-2">
                                                                                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider text-xs">Total Utilization</span>
                                                                                    <span className="text-lg font-black text-primary">{u.totalFunding.toLocaleString()}€</span>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-soft border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden">
                            <CardHeader className="pb-6 border-b border-border/40 bg-zinc-50/50 dark:bg-zinc-900/20">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            <Check className="h-5 w-5 text-green-600" /> Manage Approvals
                                        </CardTitle>
                                        <CardDescription>Review or reverse previously approved certification requests.</CardDescription>
                                    </div>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        {approvedApplications.length} Approved Requests
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-zinc-50/30 dark:bg-zinc-900/10">
                                                <TableHead className="py-4 font-bold">Member</TableHead>
                                                <TableHead className="py-4 font-bold">Certification</TableHead>
                                                <TableHead className="py-4 font-bold text-right">Cost</TableHead>
                                                <TableHead className="py-4 font-bold text-center">Approved Date</TableHead>
                                                <TableHead className="py-4 text-right font-bold pr-6">Status Management</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {approvedApplications.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="py-12 text-center text-muted-foreground italic">
                                                        No approved requests found.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                approvedApplications.map((app) => (
                                                    <TableRow key={app.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors">
                                                        <TableCell className="py-4 font-medium">
                                                            {parseNameFromEmail(app.profiles?.email)}
                                                        </TableCell>
                                                        <TableCell className="py-4">{app.certifications?.certification_name}</TableCell>
                                                        <TableCell className="py-4 text-right font-bold text-primary">{app.estimated_cost}€</TableCell>
                                                        <TableCell className="py-4 text-center text-muted-foreground text-xs font-mono">
                                                            {new Date(app.created_at).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="py-4 text-right pr-6">
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-8 text-[10px] uppercase tracking-wider font-bold gap-1 border-amber-200 text-amber-600 hover:bg-amber-50"
                                                                    onClick={() => setReversingApp({ id: app.id, status: 'pending' })}
                                                                >
                                                                    Return to Pending
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-8 text-[10px] uppercase tracking-wider font-bold gap-1 border-destructive/20 text-destructive hover:bg-destructive/5"
                                                                    onClick={() => setReversingApp({ id: app.id, status: 'rejected' })}
                                                                >
                                                                    Reject Request
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="sync" className="animate-fade-in">
                        <Card className="shadow-soft border-border/60 bg-card/80 backdrop-blur-sm max-w-4xl mx-auto overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-primary to-purple-400" />
                            <CardHeader className="pb-8">
                                <CardTitle className="text-2xl flex items-center gap-2">
                                    <RefreshCw className={`h-6 w-6 text-primary ${syncing ? 'animate-spin' : ''}`} /> Google Sheets Sync
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Refresh the certification catalog by pulling the latest data from your Google Spreadsheet.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8 pb-10">
                                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 backdrop-blur-sm flex gap-6 items-center">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-zinc-800 shadow-warm shrink-0">
                                        <ShieldAlert className="h-7 w-7 text-primary" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <h4 className="font-bold text-foreground">Auth Provider Token</h4>
                                        <p className="text-sm text-muted-foreground">Your session must be authorized to access Google Drive and Sheets APIs.</p>
                                    </div>
                                    <Button onClick={() => linkGoogleSheets()} variant="outline" className="rounded-xl border-primary/30 hover:bg-primary/5 hover-lift">
                                        Authorize API
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">Spreadsheet ID</label>
                                        <Input
                                            placeholder="Enter your Google Sheet ID"
                                            value={sheetId}
                                            onChange={(e) => setSheetId(e.target.value)}
                                            className="h-12 rounded-xl bg-background/50 border-border/60 focus:ring-primary shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">Tab ID (GID)</label>
                                        <div className="flex gap-4">
                                            <Input
                                                placeholder="e.g. 0"
                                                value={sheetName}
                                                onChange={(e) => setSheetName(e.target.value)}
                                                className="h-12 rounded-xl bg-background/50 border-border/60 focus:ring-primary shadow-sm"
                                            />
                                            <Button onClick={handleSync} disabled={syncing} className="h-12 px-8 rounded-xl shadow-warm hover-lift gap-2 shrink-0">
                                                {syncing ? <Loader2 className="animate-spin h-5 w-5" /> : <RefreshCw className="h-5 w-5" />}
                                                {syncing ? "Syncing..." : "Sync Now"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                {lastSync && (
                                    <div className="flex items-center gap-3 pt-6 border-t border-border/40 text-sm text-muted-foreground animate-fade-in">
                                        <Calendar className="h-4 w-4 text-primary opacity-60" />
                                        <span>Last successful synchronization: <span className="font-bold text-foreground">{lastSync}</span></span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
                <AlertDialog open={reversingApp !== null} onOpenChange={(open) => !open && setReversingApp(null)}>
                    <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/60 shadow-2xl rounded-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold font-display">
                                <AlertCircle className="h-5 w-5 text-amber-500" /> Confirm Status Change
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-sm py-2">
                                You are about to change an <span className="font-bold text-green-600">Approved</span> request back to <span className="font-bold text-foreground">"{reversingApp?.status}"</span>.
                                This will affect the analytics data and the user's dashboard. Are you sure?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel className="rounded-xl border-border/60 hover:bg-secondary/50">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    if (reversingApp) {
                                        updateApplicationStatus(reversingApp.id, reversingApp.status);
                                        setReversingApp(null);
                                    }
                                }}
                                className={`rounded-xl px-6 ${reversingApp?.status === 'rejected' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'} shadow-warm`}
                            >
                                Confirm Change
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
};

export default memo(AdminDashboard);
