import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { RefreshCw, Check, X, ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";

const AdminDashboard = () => {
    const { session, isAdmin, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [sheetId, setSheetId] = useState("");
    const [sheetName, setSheetName] = useState("");
    const [syncing, setSyncing] = useState(false);
    const [stats, setStats] = useState({ users: 0, completed: 0, total_certs: 0 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [applications, setApplications] = useState<any[]>([]);

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            toast.error("Unauthorized access");
            navigate("/");
        }
    }, [authLoading, isAdmin, navigate]);

    useEffect(() => {
        if (isAdmin) {
            fetchStats();
            fetchApplications();
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

                if (sheetIdSetting) setSheetId(sheetIdSetting.value);
                if (sheetTabSetting) setSheetName(sheetTabSetting.value);
            }
        } catch (error) {
            console.error("Failed to load settings", error);
        }
    };

    const saveSettings = async (id: string, tab: string) => {
        try {
            const updates = [
                { key: 'google_sheet_id', value: id },
                { key: 'google_sheet_tab', value: tab }
            ];

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

        setStats({
            users: userCount || 0,
            completed: completedCount || 0,
            total_certs: certsCount || 0
        });
    };

    const fetchApplications = async () => {
        const { data } = await supabase
            .from('applications')
            .select('*, profiles(email), certifications(certification_name)')
            .eq('status', 'pending');

        if (data) setApplications(data);
    };

    const handleSync = async () => {
        const cleanSheetId = sheetId.trim();
        const cleanSheetName = sheetName.trim();

        if (!cleanSheetId) {
            toast.error("Please enter a Google Sheet ID");
            return;
        }
        setSyncing(true);

        // Persist settings on attempt
        saveSettings(cleanSheetId, cleanSheetName);

        console.log("Starting Sync...");

        try {
            if (!session?.provider_token) {
                console.error("No provider token in session");
                throw new Error("No Google Access Token found. Please click 'Authorize Sheets Access' above.");
            }

            console.log("Token found. Fetching metadata for Sheet ID:", cleanSheetId);

            // Step 1: Resolve GID to Sheet Name if provided
            let finalRange = 'A:Z';
            if (cleanSheetName) {
                // Treat cleanSheetName as GID (e.g. "0", "1234")
                const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${cleanSheetId}?fields=sheets.properties`;
                const metaResponse = await fetch(metaUrl, {
                    headers: { Authorization: `Bearer ${session.provider_token}` },
                });

                if (!metaResponse.ok) {
                    const status = metaResponse.status;
                    const errText = await metaResponse.text();
                    console.error("Meta Fetch Failed:", status, errText);

                    if (status === 401 || status === 403) throw new Error("AUTH_REQUIRED");
                    if (status === 404) throw new Error("Spreadsheet not found. Check ID.");
                    throw new Error(`Metadata Error: ${status} - ${errText}`);
                }

                const metaData = await metaResponse.json();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const matchingSheet = metaData.sheets.find((s: any) => s.properties.sheetId.toString() === cleanSheetName);

                if (matchingSheet) {
                    console.log("Found matching sheet title:", matchingSheet.properties.title);
                    finalRange = `'${matchingSheet.properties.title}'!A:Z`;
                } else {
                    console.warn(`GID ${cleanSheetName} not found. Falling back to using it as raw name.`);
                    finalRange = `'${cleanSheetName}'!A:Z`;
                }
            }

            // Step 2: Fetch Values
            const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${cleanSheetId}/values/${finalRange}`;
            console.log("Fetching values from:", valuesUrl);

            const response = await fetch(valuesUrl, {
                headers: {
                    Authorization: `Bearer ${session.provider_token}`,
                },
            });

            if (!response.ok) {
                const status = response.status;
                const errText = await response.text();
                console.error("Values Fetch Failed:", status, errText);

                if (status === 401 || status === 403) {
                    throw new Error("AUTH_REQUIRED");
                }
                const errorJson = JSON.parse(errText);
                throw new Error(`Sheets API Error: ${errorJson.error?.message || errText}`);
            }

            const data = await response.json();
            const rows = data.values;

            if (!rows || rows.length < 2) {
                throw new Error("No data found in sheet (or only header row)");
            }

            // Step 3: Map Columns
            // Expected: [Certification Name, Area, Technology, Level, Certificate Quality, URL, Provider, Time to Complete Exam, Price, Currency, Last Checked, Notes, Price in EUR]

            const headers = rows[0].map((h: string) => h.toLowerCase().trim());
            console.log("Found headers:", headers);

            const getIndex = (keys: string[]) => headers.findIndex((h: string) => keys.some(k => h.includes(k)));

            // Mappings
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

            if (idxName === -1) {
                throw new Error("Could not find 'Certification Name' column");
            }

            const certificationsToUpsert = rows.slice(1).map((row: string[]) => {
                const getVal = (idx: number) => (idx !== -1 && row[idx]) ? row[idx].trim() : "";

                // Helper to parse currency/numbers
                const parsePrice = (val: string) => {
                    if (!val) return 0;
                    return parseFloat(val.replace(/[^\d.-]/g, '')) || 0;
                }

                // If Price EUR index detected, ensure we don't accidentally pick it for regular price if generic 'price' keyword matches it
                // Logic: idxPrice will be first match. If it matches price eur, try to find another 'price'?
                // Simpler: Trust the findIndex order or specific names. "price" vs "price in EUR".
                const finalIdxPrice = idxPrice;
                if (finalIdxPrice === idxPriceEur) {
                    // Try finding price again excluding this index? Or assume headers are distinct enough.
                    // Let's assume input matches expected: "Price" and "Price in EUR"
                }

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

            console.log(`Prepared ${certificationsToUpsert.length} rows for upsert`);

            for (const cert of certificationsToUpsert) {
                try {
                    const { data: existing } = await supabase
                        .from('certifications')
                        .select('id')
                        .eq('certification_name', cert.certification_name)
                        .maybeSingle();

                    if (existing) {
                        await supabase.from('certifications').update(cert).eq('id', existing.id);
                    } else {
                        await supabase.from('certifications').insert(cert);
                    }
                } catch (e) {
                    console.error("Supabase upsert error", e);
                }
            }

            toast.success(`Success! Synced ${certificationsToUpsert.length} certifications.`);
            fetchStats();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("SYNC FATAL ERROR:", error);
            if (error.message === "AUTH_REQUIRED" || error.message.includes("No provider token")) {
                toast.error("Auth Token Missing/Invalid. Please CLICK 'Authorize Sheets Access' button.");
            } else {
                toast.error(error.message || "Failed to sync. Check console.");
            }
        } finally {
            setSyncing(false);
        }
    };

    // Add a specific button in the UI for re-auth
    const { linkGoogleSheets } = useAuth();

    const updateApplicationStatus = async (id: string, status: 'approved' | 'rejected') => {
        const { error } = await supabase.from('applications').update({ status }).eq('id', id);
        if (error) {
            toast.error("Failed to update status");
        } else {
            toast.success(`Application ${status}`);
            fetchApplications();
        }
    };

    if (authLoading || !isAdmin) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="shrink-0">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{stats.users}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Completed Certs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{stats.completed}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Total Certifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{stats.total_certs}</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="sync">
                <TabsList>
                    <TabsTrigger value="sync">Sync Data</TabsTrigger>
                    <TabsTrigger value="applications">Applications</TabsTrigger>
                </TabsList>

                <TabsContent value="sync" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Google Sheets Sync</CardTitle>
                            <CardDescription>
                                Import certifications from a Google Sheet. Ensure the sheet has headers like Name, Area, Language, Provider, Price, etc.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-200 dark:border-blue-800 text-sm">
                                <p className="font-semibold mb-2">First Time Setup:</p>
                                <p className="mb-2">To access the spreadsheet, you must grant additional permissions to your Google account.</p>
                                <Button variant="outline" size="sm" onClick={() => linkGoogleSheets()} className="gap-2">
                                    <ShieldAlert className="h-4 w-4" />
                                    Authorize Sheets Access
                                </Button>
                            </div>
                            <div className="flex gap-4">
                                <Input
                                    placeholder="Enter Google Sheet ID"
                                    value={sheetId}
                                    onChange={(e) => setSheetId(e.target.value)}
                                    className="flex-1"
                                />
                                <Input
                                    placeholder="Tab ID (gid) - e.g. 0"
                                    value={sheetName}
                                    onChange={(e) => setSheetName(e.target.value)}
                                    className="w-48"
                                />
                                <Button onClick={handleSync} disabled={syncing}>
                                    {syncing ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2" />}
                                    Sync
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="applications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Funding Requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {applications.length === 0 ? (
                                <p className="text-muted-foreground">No pending applications.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Certification</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {applications.map((app) => (
                                            <TableRow key={app.id}>
                                                <TableCell>{app.profiles?.email}</TableCell>
                                                <TableCell>{app.certifications?.certification_name}</TableCell>
                                                <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell className="flex gap-2">
                                                    <Button size="sm" variant="default" onClick={() => updateApplicationStatus(app.id, 'approved')}>
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => updateApplicationStatus(app.id, 'rejected')}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminDashboard;
