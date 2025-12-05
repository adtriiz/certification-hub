import { useState, useEffect, useCallback } from "react";
import { UserCertificationData, FundingApplication, CompletedCertification } from "@/types/userCertifications";

const STORAGE_KEY = "user-certification-data";

const defaultData: UserCertificationData = {
  favorites: [],
  applications: [],
  completedCertifications: [],
};

export const useUserCertifications = () => {
  const [data, setData] = useState<UserCertificationData>(defaultData);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch {
        setData(defaultData);
      }
    }
  }, []);

  const saveData = useCallback((newData: UserCertificationData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  }, []);

  const toggleFavorite = useCallback((certificationId: string) => {
    setData((prev) => {
      const newFavorites = prev.favorites.includes(certificationId)
        ? prev.favorites.filter((id) => id !== certificationId)
        : [...prev.favorites, certificationId];
      const newData = { ...prev, favorites: newFavorites };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  }, []);

  const isFavorite = useCallback(
    (certificationId: string) => data.favorites.includes(certificationId),
    [data.favorites]
  );

  const applyForFunding = useCallback(
    (certificationId: string, certificationName: string, reason: string, estimatedCost: number) => {
      const application: FundingApplication = {
        id: crypto.randomUUID(),
        certificationId,
        certificationName,
        status: "pending",
        appliedAt: new Date().toISOString(),
        reason,
        estimatedCost,
      };
      setData((prev) => {
        const newData = { ...prev, applications: [...prev.applications, application] };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        return newData;
      });
    },
    []
  );

  const hasApplied = useCallback(
    (certificationId: string) =>
      data.applications.some((app) => app.certificationId === certificationId),
    [data.applications]
  );

  const addCompletedCertification = useCallback(
    (certificationId: string, certificationName: string, expiresAt?: string) => {
      const completed: CompletedCertification = {
        id: crypto.randomUUID(),
        certificationId,
        certificationName,
        completedAt: new Date().toISOString(),
        expiresAt,
      };
      setData((prev) => {
        const newData = {
          ...prev,
          completedCertifications: [...prev.completedCertifications, completed],
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        return newData;
      });
    },
    []
  );

  const uploadProof = useCallback((completedCertId: string, fileName: string) => {
    setData((prev) => {
      const newCompleted = prev.completedCertifications.map((cert) =>
        cert.id === completedCertId
          ? { ...cert, proofFileName: fileName, proofUploadedAt: new Date().toISOString() }
          : cert
      );
      const newData = { ...prev, completedCertifications: newCompleted };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  }, []);

  const removeCompletedCertification = useCallback((completedCertId: string) => {
    setData((prev) => {
      const newData = {
        ...prev,
        completedCertifications: prev.completedCertifications.filter(
          (cert) => cert.id !== completedCertId
        ),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  }, []);

  const isCompleted = useCallback(
    (certificationId: string) =>
      data.completedCertifications.some((cert) => cert.certificationId === certificationId),
    [data.completedCertifications]
  );

  return {
    favorites: data.favorites,
    applications: data.applications,
    completedCertifications: data.completedCertifications,
    toggleFavorite,
    isFavorite,
    applyForFunding,
    hasApplied,
    addCompletedCertification,
    uploadProof,
    removeCompletedCertification,
    isCompleted,
  };
};
