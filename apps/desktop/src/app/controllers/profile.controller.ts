import { useState, useEffect } from "react";
import { profileService } from "../services";
import type { Profile, Meeting, CreateProfileDTO, CreateMeetingDTO } from "../models";

export function useProfileController(slug: string = "default") {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await profileService.getProfile(slug);
      setProfile(p);
      if (p) {
        const m = await profileService.getMeetings(p.id);
        setMeetings(m);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados do backend Docker");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slug]);

  const saveProfile = async (dto: CreateProfileDTO) => {
    const saved = await profileService.saveProfile(dto);
    if (saved) {
      setProfile(saved);
      loadData();
    }
    return saved;
  };

  const scheduleMeeting = async (dto: CreateMeetingDTO) => {
    const meeting = await profileService.createMeeting(dto);
    if (meeting) {
      setMeetings((prev) => [...prev, meeting]);
    }
    return meeting;
  };

  return {
    profile,
    meetings,
    loading,
    error,
    saveProfile,
    scheduleMeeting,
    reload: loadData,
  };
}
