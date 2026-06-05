const USER_PROFILE_KEY_PREFIX = "ara_user_profile";

export const emptyUserProfile = {
  name: "",
  age: "",
  gender: "",
  heightCm: "",
  weightKg: "",
  targetAreas: "",
  bio: "",
};

export function getCachedUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getUserProfileKey() {
  const cachedUser = getCachedUser();
  const email = String(cachedUser?.email || "").trim().toLowerCase();
  return email ? `${USER_PROFILE_KEY_PREFIX}:${encodeURIComponent(email)}` : USER_PROFILE_KEY_PREFIX;
}

export function getUserProfile() {
  try {
    const raw = localStorage.getItem(getUserProfileKey());
    return raw ? { ...emptyUserProfile, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

export function hasUserProfile() {
  const profile = getUserProfile();
  return Boolean(profile?.name && profile?.heightCm && profile?.weightKg && profile?.targetAreas);
}

export function buildInitialUserProfile() {
  const cachedProfile = getUserProfile();
  if (cachedProfile) return cachedProfile;

  const cachedUser = getCachedUser();
  return {
    ...emptyUserProfile,
    name: cachedUser?.name || "",
  };
}

export function saveUserProfile(profile) {
  const normalized = {
    ...emptyUserProfile,
    ...profile,
    name: String(profile.name || "").trim(),
    age: String(profile.age || "").trim(),
    gender: String(profile.gender || "").trim(),
    heightCm: String(profile.heightCm || "").trim(),
    weightKg: String(profile.weightKg || "").trim(),
    targetAreas: String(profile.targetAreas || "").trim(),
    bio: String(profile.bio || "").trim(),
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(getUserProfileKey(), JSON.stringify(normalized));
  return normalized;
}

export function clearUserProfile() {
  localStorage.removeItem(getUserProfileKey());
}
