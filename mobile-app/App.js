import Constants from "expo-constants";
import * as FileSystem from "expo-file-system";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Platform,
  Pressable,
  StatusBar as RNStatusBar,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { WebView } from "react-native-webview";

const config = Constants.expoConfig?.extra || {};
const firebaseProjectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || config.firebaseProjectId || "website-99ec7";
const apiBaseUrl = String(process.env.EXPO_PUBLIC_API_BASE_URL || config.apiBaseUrl || config.acadexUrl || "https://acadex-one-beta.vercel.app").replace(/\/$/, "");
const firestoreBase = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents`;
const downloadDir = `${FileSystem.documentDirectory}acadex-files/`;
const registryPath = `${FileSystem.documentDirectory}acadex-downloads.json`;
const notificationRegistryPath = `${FileSystem.documentDirectory}acadex-notifications.json`;
const navItems = [
  { key: "Dashboard", label: "Home", icon: "A" },
  { key: "Subject", label: "Subject", icon: "S" },
  { key: "Routine", label: "Class", icon: "R" },
  { key: "Search", label: "Search", icon: "Q" }
];
const drawerItems = [
  { key: "Teacher", label: "Teacher", icon: "T" },
  { key: "Calendar", label: "Calendar", icon: "C" },
  { key: "Notice", label: "Notice", icon: "N" },
  { key: "Lab", label: "Lab", icon: "L" },
  { key: "Updates", label: "Updates", icon: "U" },
  { key: "Settings", label: "Theme", icon: "G" },
  { key: "Downloads", label: "Files", icon: "D" }
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

const themes = {
  glass: {
    label: "Liquid Glass",
    base: "#050816",
    card: "rgba(255,255,255,0.09)",
    cardStrong: "rgba(255,255,255,0.14)",
    text: "#f8fafc",
    muted: "#a9b8d3",
    accent: "#4f7cff",
    accent2: "#7dd3fc",
    danger: "#fb7185"
  },
  emerald: {
    label: "Emerald",
    base: "#031b1b",
    card: "rgba(199,249,204,0.12)",
    cardStrong: "rgba(128,237,153,0.22)",
    text: "#f0fff4",
    muted: "#b7e4c7",
    accent: "#57cc99",
    accent2: "#38a3a5",
    danger: "#fb7185"
  },
  sunset: {
    label: "Sunset",
    base: "#271003",
    card: "rgba(255,230,167,0.13)",
    cardStrong: "rgba(255,149,5,0.22)",
    text: "#fff7ed",
    muted: "#fed7aa",
    accent: "#ff9505",
    accent2: "#ffb627",
    danger: "#ef4444"
  },
  rose: {
    label: "Rose",
    base: "#270617",
    card: "rgba(255,179,193,0.13)",
    cardStrong: "rgba(255,77,109,0.22)",
    text: "#fff1f2",
    muted: "#fecdd3",
    accent: "#ff4d6d",
    accent2: "#ff758f",
    danger: "#fb7185"
  },
  amoled: {
    label: "Amoled",
    base: "#000000",
    card: "rgba(255,255,255,0.07)",
    cardStrong: "rgba(255,255,255,0.12)",
    text: "#ffffff",
    muted: "#a3a3a3",
    accent: "#60a5fa",
    accent2: "#a78bfa",
    danger: "#f87171"
  }
};

function firestoreValue(value) {
  if (!value || typeof value !== "object") return value;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return Boolean(value.booleanValue);
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(firestoreValue);
  if ("mapValue" in value) return firestoreFields(value.mapValue.fields || {});
  return value;
}

function firestoreFields(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, firestoreValue(value)]));
}

function parseDoc(doc) {
  const id = String(doc.name || "").split("/").pop();
  return { id, ...firestoreFields(doc.fields || {}) };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Server returned non-JSON response (${response.status}).`);
  }
  if (!response.ok) {
    throw new Error(body?.error?.message || body?.error || "Request failed");
  }
  return body;
}

async function fetchCollection(name, idToken) {
  const body = await fetchJson(`${firestoreBase}/${name}?pageSize=300`, {
    headers: { Authorization: `Bearer ${idToken}` }
  });
  return (body.documents || []).map(parseDoc);
}

async function fetchDocument(path, idToken) {
  const body = await fetchJson(`${firestoreBase}/${path}`, {
    headers: { Authorization: `Bearer ${idToken}` }
  });
  return parseDoc(body);
}

function safeFilename(name) {
  return String(name || "acadex-file")
    .replace(/[^\w.\- ]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90) || "acadex-file";
}

function extensionFrom(item) {
  const direct = String(item.format || "").trim().toLowerCase();
  if (direct) return direct;
  const name = String(item.originalName || item.title || item.attachmentName || "").toLowerCase();
  const match = name.match(/\.([a-z0-9]+)$/);
  if (match) return match[1];
  const type = String(item.fileType || "").toLowerCase();
  if (type.includes("pdf")) return "pdf";
  if (type.includes("png")) return "png";
  if (type.includes("jpeg")) return "jpg";
  if (type.includes("wordprocessing")) return "docx";
  if (type.includes("presentation")) return "pptx";
  if (type.includes("spreadsheet")) return "xlsx";
  return "";
}

function filenameFor(item) {
  const base = safeFilename(item.originalName || item.title || item.attachmentName || "acadex-file");
  if (base.includes(".")) return base;
  const ext = extensionFrom(item);
  return ext ? `${base}.${ext}` : base;
}

function isImage(item) {
  const ext = extensionFrom(item);
  const type = String(item.fileType || "").toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) || type.startsWith("image/");
}

function isText(item) {
  const ext = extensionFrom(item);
  const type = String(item.fileType || "").toLowerCase();
  return ["txt", "csv", "md", "json"].includes(ext) || type.startsWith("text/");
}

function canUseDocsViewer(item) {
  return ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(extensionFrom(item));
}

async function readRegistry() {
  try {
    const info = await FileSystem.getInfoAsync(registryPath);
    if (!info.exists) return {};
    return JSON.parse(await FileSystem.readAsStringAsync(registryPath));
  } catch {
    return {};
  }
}

async function writeRegistry(registry) {
  await FileSystem.writeAsStringAsync(registryPath, JSON.stringify(registry));
}

async function readNotificationRegistry() {
  try {
    const info = await FileSystem.getInfoAsync(notificationRegistryPath);
    if (!info.exists) return { announced: {}, reminders: {} };
    const parsed = JSON.parse(await FileSystem.readAsStringAsync(notificationRegistryPath));
    return {
      announced: parsed?.announced || {},
      reminders: parsed?.reminders || {}
    };
  } catch {
    return { announced: {}, reminders: {} };
  }
}

async function writeNotificationRegistry(registry) {
  await FileSystem.writeAsStringAsync(notificationRegistryPath, JSON.stringify(registry));
}

function dateKey() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function upcomingExamEvents(exams) {
  const today = dateKey();
  return (Array.isArray(exams) ? exams : [])
    .filter((event) => String(event.examDate || "") >= today)
    .sort((a, b) => String(a.examDate || "").localeCompare(String(b.examDate || "")) || String(a.startTime || "").localeCompare(String(b.startTime || "")));
}

function notificationKeyFor(event) {
  return `${event.id}:${event.examDate || ""}:${event.startTime || ""}:${event.title || ""}`;
}

function reminderDateFor(event) {
  if (!event?.examDate) return null;
  const reminder = new Date(`${event.examDate}T09:00:00`);
  if (!Number.isFinite(reminder.getTime()) || reminder <= new Date()) return null;
  return reminder;
}

async function configureNotifications() {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("exam-reminders", {
        name: "Exam reminders",
        importance: Notifications.AndroidImportance.MAX,
        sound: "default",
        vibrationPattern: [0, 400, 200, 400]
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    const finalStatus = existing.status === "granted" ? existing.status : (await Notifications.requestPermissionsAsync()).status;
    return finalStatus === "granted";
  } catch {
    return false;
  }
}

async function syncExamNotifications(exams, { announceNew }) {
  const allowed = await configureNotifications();
  if (!allowed) return;

  const registry = await readNotificationRegistry();
  const next = {
    announced: { ...registry.announced },
    reminders: { ...registry.reminders }
  };

  for (const event of upcomingExamEvents(exams)) {
    const key = notificationKeyFor(event);
    const kind = (event.kind || "exam") === "event" ? "event" : "exam";
    const title = event.title || (kind === "event" ? "New event" : "New exam");

    if (announceNew && !next.announced[key]) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: kind === "event" ? "New event added" : "New exam added",
          body: `${title}${event.examDate ? ` on ${event.examDate}` : ""}`,
          sound: "default"
        },
        trigger: null
      }).catch(() => null);
    }
    next.announced[key] = true;

    const reminderDate = reminderDateFor(event);
    if (reminderDate && !next.reminders[key]) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: kind === "event" ? "Event reminder" : "Exam reminder",
          body: `${title} is today at ${event.startTime || "scheduled time"}.`,
          sound: "default"
        },
        trigger: reminderDate
      }).catch(() => null);
      next.reminders[key] = true;
    }
  }

  await writeNotificationRegistry(next);
}

function normalizeAcadexData(data) {
  const subjects = Array.isArray(data.subjects) ? data.subjects : [];
  const subjectMap = new Map(subjects.map((subject) => [subject.id, subject.name]));
  const files = [
    ...(Array.isArray(data.files) ? data.files : []).map((file) => ({
      key: `file:${file.id}`,
      kind: "file",
      collection: "files",
      id: file.id,
      title: file.title || file.originalName || "File",
      originalName: file.originalName,
      fileUrl: file.fileUrl,
      fileType: file.fileType,
      format: file.format,
      publicId: file.publicId,
      subjectId: file.subjectId,
      subjectName: file.subjectName || subjectMap.get(file.subjectId) || "General",
      date: file.uploadDate || file.createdAt || ""
    })),
    ...(Array.isArray(data.resources) ? data.resources : [])
      .filter((resource) => resource.type === "file" && resource.fileUrl)
      .map((resource) => ({
        key: `resource:${resource.id}`,
        kind: "resource",
        collection: "subjectResources",
        id: resource.id,
        title: resource.name || resource.originalName || "Subject file",
        originalName: resource.originalName || resource.name,
        fileUrl: resource.fileUrl,
        fileType: resource.fileType,
        format: resource.format,
        publicId: resource.publicId,
        subjectId: resource.subjectId,
        sectionId: resource.sectionId,
        subjectName: subjectMap.get(resource.subjectId) || "Subject",
        date: resource.createdAt || ""
      })),
    ...(Array.isArray(data.notices) ? data.notices : [])
      .filter((notice) => notice.fileUrl)
      .map((notice) => ({
        key: `notice:${notice.id}`,
        kind: "notice",
        collection: "notices",
        id: notice.id,
        title: notice.text || notice.attachmentName || "Notice file",
        originalName: notice.attachmentName,
        fileUrl: notice.fileUrl,
        fileType: notice.fileType,
        format: notice.format,
        publicId: notice.publicId,
        subjectName: "Notice",
        date: notice.date || ""
      })),
    ...(Array.isArray(data.labs) ? data.labs : [])
      .filter((lab) => lab.fileUrl)
      .map((lab) => ({
        key: `lab:${lab.id}`,
        kind: "lab",
        collection: "labs",
        id: lab.id,
        title: lab.title || "Lab document",
        originalName: lab.title,
        fileUrl: lab.fileUrl,
        subjectId: lab.subjectId,
        subjectName: lab.subjectName || subjectMap.get(lab.subjectId) || "Lab",
        date: lab.date || ""
      }))
  ].filter((file) => file.fileUrl);

  const exams = upcomingExamEvents(data.exams);

  return {
    profile: data.profile || null,
    subjects,
    sections: Array.isArray(data.sections) ? data.sections : [],
    resources: Array.isArray(data.resources) ? data.resources : [],
    files,
    notices: Array.isArray(data.notices) ? data.notices : [],
    labs: Array.isArray(data.labs) ? data.labs : [],
    exams,
    routines: Array.isArray(data.routines) ? data.routines : [],
    teachers: Array.isArray(data.teachers) ? data.teachers : [],
    syncedAt: new Date().toISOString()
  };
}

function todayRoutine(routines) {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = days[new Date().getDay()];
  return routines.filter((routine) => routine.day === today).sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
}

function buildLocalSearchResults(data, query) {
  const value = String(query || "").trim().toLowerCase();
  if (!value) return [];

  const matches = (...items) => items.some((item) => String(item || "").toLowerCase().includes(value));
  const results = [];

  data.files.forEach((file) => {
    if (matches(file.title, file.subjectName, extensionFrom(file))) {
      results.push({
        key: file.key,
        type: "File",
        title: file.title,
        subtitle: file.subjectName || "Academic file",
        item: file
      });
    }
  });

  data.subjects.forEach((subject) => {
    if (matches(subject.name, subject.code, subject.semesterName)) {
      results.push({
        key: `subject:${subject.id}`,
        type: "Subject",
        title: subject.name,
        subtitle: subject.code || subject.semesterName || "Subject",
        target: "Subject"
      });
    }
  });

  data.teachers.forEach((teacher) => {
    if (matches(teacher.name, teacher.designation, teacher.email)) {
      results.push({
        key: `teacher:${teacher.id}`,
        type: "Teacher",
        title: teacher.name || "Teacher",
        subtitle: teacher.designation || "Faculty",
        target: "Teacher"
      });
    }
  });

  data.notices.forEach((notice) => {
    if (matches(notice.text, notice.attachmentName)) {
      results.push({
        key: `notice-result:${notice.id}`,
        type: "Notice",
        title: notice.text || notice.attachmentName || "Notice",
        subtitle: notice.date ? new Date(notice.date).toLocaleString() : "Notice",
        target: "Notice"
      });
    }
  });

  data.labs.forEach((lab) => {
    if (matches(lab.title, lab.subjectName, lab.description)) {
      results.push({
        key: `lab-result:${lab.id}`,
        type: "Lab",
        title: lab.title || "Lab",
        subtitle: lab.subjectName || "Lab document",
        target: "Lab"
      });
    }
  });

  data.routines.forEach((routine) => {
    if (matches(routine.subjectName, routine.teacherName, routine.room, routine.day)) {
      results.push({
        key: `routine:${routine.id}`,
        type: "Routine",
        title: routine.subjectName || "Class routine",
        subtitle: `${routine.day || "Class"} ${routine.startTime || ""}`.trim(),
        target: "Routine"
      });
    }
  });

  data.exams.forEach((event) => {
    if (matches(event.title, event.subjectName, event.examDate, event.kind)) {
      results.push({
        key: `calendar:${event.id}`,
        type: (event.kind || "exam") === "event" ? "Event" : "Exam",
        title: event.title || "Calendar event",
        subtitle: event.examDate || "Calendar",
        target: "Calendar"
      });
    }
  });

  return results.slice(0, 30);
}

function FlowBackground({ theme }) {
  const motion = useRef(new Animated.Value(0)).current;
  const { width, height } = Dimensions.get("window");

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, { toValue: 1, duration: 5200, useNativeDriver: true }),
        Animated.timing(motion, { toValue: 0, duration: 5200, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [motion]);

  const driftA = motion.interpolate({ inputRange: [0, 1], outputRange: [-30, 55] });
  const driftB = motion.interpolate({ inputRange: [0, 1], outputRange: [45, -35] });
  const scale = motion.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.base }]}>
      <Animated.View
        style={[
          styles.blob,
          {
            width: width * 0.78,
            height: width * 0.78,
            backgroundColor: theme.accent,
            opacity: 0.22,
            transform: [{ translateX: driftA }, { translateY: driftB }, { scale }]
          }
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          {
            right: -90,
            top: height * 0.18,
            width: width * 0.72,
            height: width * 0.72,
            backgroundColor: theme.accent2,
            opacity: 0.16,
            transform: [{ translateX: driftB }, { translateY: driftA }]
          }
        ]}
      />
    </View>
  );
}

export default function App() {
  const [idToken, setIdToken] = useState("");
  const [localId, setLocalId] = useState("");
  const [profile, setProfile] = useState(null);
  const [roll, setRoll] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [themeName, setThemeName] = useState("glass");
  const [data, setData] = useState(normalizeAcadexData({}));
  const [downloads, setDownloads] = useState({});
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [viewer, setViewer] = useState(null);
  const [textPreview, setTextPreview] = useState("");
  const notificationsPrimedRef = useRef(false);
  const sectionMotion = useRef(new Animated.Value(1)).current;
  const theme = themes[themeName] || themes.glass;

  const dynamic = useMemo(() => makeDynamicStyles(theme), [theme]);
  const downloadedItems = useMemo(() => data.files.filter((item) => downloads[item.key]?.uri), [data.files, downloads]);
  const searchResults = useMemo(() => buildLocalSearchResults(data, searchQuery), [data, searchQuery]);
  const sectionTranslateY = sectionMotion.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  const downloadOne = useCallback(async (item, currentRegistry) => {
    if (!item?.fileUrl || currentRegistry[item.key]?.uri) return currentRegistry;
    await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
    const filename = `${item.kind}-${item.id}-${filenameFor(item)}`;
    const localUri = `${downloadDir}${filename}`;
    const result = await FileSystem.downloadAsync(item.fileUrl, localUri);
    const nextRegistry = {
      ...currentRegistry,
      [item.key]: {
        uri: result.uri,
        title: item.title,
        kind: item.kind,
        id: item.id,
        downloadedAt: new Date().toISOString()
      }
    };
    await writeRegistry(nextRegistry);
    return nextRegistry;
  }, []);

  const syncNow = useCallback(
    async ({ silent = false } = {}) => {
      if (!idToken || !localId) return;
      setSyncing(true);
      if (!silent) setMessage("Syncing from Firebase...");
      try {
        const [profileDoc, subjects, sections, resources, files, notices, routines, teachers, labs, exams] = await Promise.all([
          fetchDocument(`users/${localId}`, idToken),
          fetchCollection("subjects", idToken),
          fetchCollection("subjectSections", idToken),
          fetchCollection("subjectResources", idToken),
          fetchCollection("files", idToken),
          fetchCollection("notices", idToken),
          fetchCollection("classRoutines", idToken),
          fetchCollection("teachers", idToken),
          fetchCollection("labs", idToken),
          fetchCollection("exams", idToken)
        ]);
        const normalized = normalizeAcadexData({ profile: profileDoc, subjects, sections, resources, files, notices, routines, teachers, labs, exams });
        setData(normalized);
        setProfile(normalized.profile);
        await syncExamNotifications(normalized.exams, { announceNew: notificationsPrimedRef.current }).catch(() => null);
        notificationsPrimedRef.current = true;

        let registry = await readRegistry();
        for (const item of normalized.files) {
          registry = await downloadOne(item, registry).catch(() => registry);
        }
        setDownloads(registry);
        if (!silent) setMessage(`Synced ${normalized.files.length} file(s).`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Sync failed");
      } finally {
        setSyncing(false);
      }
    },
    [downloadOne, idToken, localId]
  );

  useEffect(() => {
    readRegistry().then(setDownloads);
  }, []);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(""), 4200);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!idToken || !localId) return undefined;
    syncNow();
    const timer = setInterval(() => syncNow({ silent: true }), 30000);
    return () => clearInterval(timer);
  }, [idToken, localId, syncNow]);

  const changeSection = useCallback(
    (nextTab) => {
      if (nextTab === "Search") {
        setSearchOpen(true);
        return;
      }
      if (nextTab === activeTab) return;
      Animated.timing(sectionMotion, {
        toValue: 0,
        duration: 90,
        useNativeDriver: true
      }).start(() => {
        setActiveTab(nextTab);
        Animated.spring(sectionMotion, {
          toValue: 1,
          speed: 18,
          bounciness: 4,
          useNativeDriver: true
        }).start();
      });
    },
    [activeTab, sectionMotion]
  );

  const signIn = async () => {
    if (!roll.trim() || !password) {
      setMessage("Enter roll number and password.");
      return;
    }

    setBusy(true);
    setMessage("Signing in...");
    try {
      const body = await fetchJson(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginId: roll,
          password
        })
      });
      setIdToken(body.idToken);
      setLocalId(body.localId);
      if (body.profile) setProfile(body.profile);
      setMessage("Logged in. Sync starting...");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const openItem = async (item) => {
    const local = downloads[item.key]?.uri;
    setTextPreview("");
    if (local && isText(item)) {
      const text = await FileSystem.readAsStringAsync(local).catch(() => "");
      setTextPreview(text.slice(0, 6000));
    }
    setViewer({ ...item, localUri: local || "" });
  };

  const removeLocal = async (item) => {
    const local = downloads[item.key]?.uri;
    if (local) await FileSystem.deleteAsync(local, { idempotent: true }).catch(() => null);
    const next = { ...downloads };
    delete next[item.key];
    await writeRegistry(next);
    setDownloads(next);
    setMessage("Removed from this device.");
  };

  const deleteFromWebsite = async (item) => {
    if (profile?.role !== "admin") {
      setMessage("Only admins can delete website files.");
      return;
    }
    Alert.alert("Delete from website?", `This removes ${item.title} from Acadex listings.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await fetchJson(`${firestoreBase}/${item.collection}/${item.id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${idToken}` }
            });
            await removeLocal(item);
            await syncNow({ silent: true });
            setMessage("Deleted from website listing.");
          } catch (error) {
            setMessage(error instanceof Error ? error.message : "Delete failed");
          }
        }
      }
    ]);
  };

  const openSearchResult = (result) => {
    setSearchOpen(false);
    setSearchQuery("");
    if (result.item) {
      openItem(result.item);
      return;
    }
    if (result.target) {
      changeSection(result.target);
    }
  };

  const today = todayRoutine(data.routines);

  if (!idToken) {
    return (
      <SafeAreaView style={dynamic.shell}>
        <FlowBackground theme={theme} />
        <StatusBar style="light" />
        <View style={styles.login}>
          <Text style={[styles.brand, { color: theme.text }]}>Acadex</Text>
          <Text style={[styles.loginSubtitle, { color: theme.muted }]}>Native mobile workspace</Text>
          <TextInput value={roll} onChangeText={setRoll} placeholder="Roll number" placeholderTextColor={theme.muted} keyboardType="number-pad" style={dynamic.input} />
          <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={theme.muted} secureTextEntry style={dynamic.input} />
          <Pressable disabled={busy} onPress={signIn} style={[dynamic.primaryButton, busy && styles.disabled]}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Log in</Text>}
          </Pressable>
          <Text style={[styles.message, { color: theme.accent2 }]}>{message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (viewer) {
    return (
      <SafeAreaView style={dynamic.shell}>
        <FlowBackground theme={theme} />
        <StatusBar style="light" />
        <View style={styles.viewerHeader}>
          <View>
            <Text style={[styles.viewerTitle, { color: theme.text }]}>{viewer.title}</Text>
            <Text style={[styles.muted, { color: theme.muted }]}>{viewer.localUri ? "Downloaded inside Acadex" : "Streaming inside Acadex"}</Text>
          </View>
          <Pressable onPress={() => setViewer(null)} style={dynamic.closeButton}>
            <Text style={{ color: theme.text, fontWeight: "800" }}>Close</Text>
          </Pressable>
        </View>
        {isImage(viewer) && viewer.localUri ? (
          <Image source={{ uri: viewer.localUri }} resizeMode="contain" style={styles.previewImage} />
        ) : isText(viewer) ? (
          <ScrollView style={dynamic.textPreview}>
            <Text style={[styles.textPreviewContent, { color: theme.text }]}>{textPreview || "Text preview is not available."}</Text>
          </ScrollView>
        ) : canUseDocsViewer(viewer) ? (
          <WebView source={{ uri: `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(viewer.fileUrl)}` }} style={styles.webPreview} javaScriptEnabled domStorageEnabled startInLoadingState />
        ) : (
          <View style={dynamic.card}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Preview inside Acadex</Text>
            <Text style={[styles.muted, { color: theme.muted }]}>This file is downloaded in app storage. Android WebView cannot preview every binary format, but it will stay inside Acadex.</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamic.shell}>
      <FlowBackground theme={theme} />
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Pressable onPress={() => setDrawerOpen(true)} style={dynamic.menuButton}>
            <Text style={[styles.menuIcon, { color: theme.text }]}>☰</Text>
          </Pressable>
          <BrandMark theme={theme} />
          <View>
            <Text style={[styles.brandSmall, { color: theme.text }]}>Acadex</Text>
            <Text style={[styles.muted, { color: theme.muted }]}>{profile?.loginId || profile?.phone || profile?.email || "Student"}</Text>
          </View>
        </View>
        <Pressable onPress={() => syncNow()} style={dynamic.syncButton}>
          {syncing ? <ActivityIndicator color={theme.text} /> : <Text style={[styles.syncText, { color: theme.text }]}>Sync</Text>}
        </Pressable>
      </View>

      <Animated.View style={[styles.screenTransition, { opacity: sectionMotion, transform: [{ translateY: sectionTranslateY }] }]}>
      {activeTab === "Dashboard" ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.metrics}>
            <Metric label="Subjects" value={data.subjects.length} theme={theme} dynamic={dynamic} />
            <Metric label="Files" value={data.files.length} theme={theme} dynamic={dynamic} />
            <Metric label="Downloaded" value={downloadedItems.length} theme={theme} dynamic={dynamic} />
            <Metric label="Notices" value={data.notices.length} theme={theme} dynamic={dynamic} />
          </View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Today classes</Text>
          {today.length ? today.map((routine) => <RoutineCard key={routine.id} routine={routine} theme={theme} dynamic={dynamic} />) : <Empty label="No class today." theme={theme} dynamic={dynamic} />}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Upcoming calendar</Text>
          {data.exams.slice(0, 3).map((event) => <CalendarCard key={event.id} event={event} theme={theme} dynamic={dynamic} />)}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Latest files</Text>
          {data.files.slice(0, 6).map((item) => (
            <FileCard key={item.key} item={item} downloaded={Boolean(downloads[item.key])} isAdmin={profile?.role === "admin"} onOpen={() => openItem(item)} onRemove={() => removeLocal(item)} onDeleteWebsite={() => deleteFromWebsite(item)} theme={theme} dynamic={dynamic} />
          ))}
        </ScrollView>
      ) : activeTab === "Teacher" ? (
        <FlatList
          contentContainerStyle={styles.content}
          data={data.teachers}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Empty label="No teacher added." theme={theme} dynamic={dynamic} />}
          renderItem={({ item }) => <TeacherCard teacher={item} subjects={data.subjects} theme={theme} dynamic={dynamic} />}
        />
      ) : activeTab === "Subject" ? (
        <FlatList
          contentContainerStyle={styles.content}
          data={data.subjects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const subjectFiles = data.files.filter((file) => file.subjectName === item.name || file.subjectId === item.id);
            return (
              <View style={dynamic.card}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.muted, { color: theme.muted }]}>{item.code || "Subject"} - {subjectFiles.length} file(s)</Text>
                {subjectFiles.slice(0, 5).map((file) => <MiniFile key={file.key} item={file} onPress={() => openItem(file)} downloaded={Boolean(downloads[file.key])} theme={theme} dynamic={dynamic} />)}
              </View>
            );
          }}
        />
      ) : activeTab === "Routine" ? (
        <ScrollView contentContainerStyle={styles.content}>
          {["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"].map((day) => {
            const dayRoutines = data.routines.filter((routine) => routine.day === day).sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
            return (
              <View key={day} style={dynamic.card}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{day[0].toUpperCase() + day.slice(1)}</Text>
                {dayRoutines.length ? dayRoutines.map((routine) => <RoutineCard key={routine.id} routine={routine} theme={theme} dynamic={dynamic} compact />) : <Text style={[styles.muted, { color: theme.muted }]}>No class added.</Text>}
              </View>
            );
          })}
        </ScrollView>
      ) : activeTab === "Calendar" ? (
        <FlatList
          contentContainerStyle={styles.content}
          data={data.exams}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={<MonthCalendar events={data.exams} theme={theme} dynamic={dynamic} />}
          ListEmptyComponent={<Empty label="No exam or event date added." theme={theme} dynamic={dynamic} />}
          renderItem={({ item }) => <CalendarCard event={item} theme={theme} dynamic={dynamic} />}
        />
      ) : activeTab === "Files" ? (
        <FlatList contentContainerStyle={styles.content} data={data.files} keyExtractor={(item) => item.key} renderItem={({ item }) => <FileCard item={item} downloaded={Boolean(downloads[item.key])} isAdmin={profile?.role === "admin"} onOpen={() => openItem(item)} onRemove={() => removeLocal(item)} onDeleteWebsite={() => deleteFromWebsite(item)} theme={theme} dynamic={dynamic} />} />
      ) : activeTab === "Notice" ? (
        <FlatList
          contentContainerStyle={styles.content}
          data={data.notices}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Empty label="No notice published." theme={theme} dynamic={dynamic} />}
          renderItem={({ item }) => (
            <View style={dynamic.card}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{item.text || "Notice"}</Text>
              <Text style={[styles.muted, { color: theme.muted }]}>{item.date ? new Date(item.date).toLocaleString() : "Notice"}</Text>
              {item.fileUrl ? (
                <MiniFile
                  item={{ key: `notice:${item.id}`, title: item.attachmentName || item.text || "Notice file", fileUrl: item.fileUrl, format: item.format, fileType: item.fileType, kind: "notice", collection: "notices", id: item.id, subjectName: "Notice" }}
                  onPress={() => openItem({ key: `notice:${item.id}`, title: item.attachmentName || item.text || "Notice file", fileUrl: item.fileUrl, format: item.format, fileType: item.fileType, kind: "notice", collection: "notices", id: item.id, subjectName: "Notice" })}
                  downloaded={Boolean(downloads[`notice:${item.id}`])}
                  theme={theme}
                  dynamic={dynamic}
                />
              ) : null}
            </View>
          )}
        />
      ) : activeTab === "Lab" ? (
        <FlatList
          contentContainerStyle={styles.content}
          data={data.labs}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Empty label="No lab document added." theme={theme} dynamic={dynamic} />}
          renderItem={({ item }) => (
            <View style={dynamic.card}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.muted, { color: theme.muted }]}>{item.subjectName || "Lab"}{item.description ? ` - ${item.description}` : ""}</Text>
              {item.fileUrl ? (
                <MiniFile
                  item={{ key: `lab:${item.id}`, title: item.title, fileUrl: item.fileUrl, kind: "lab", collection: "labs", id: item.id, subjectName: item.subjectName || "Lab" }}
                  onPress={() => openItem({ key: `lab:${item.id}`, title: item.title, fileUrl: item.fileUrl, kind: "lab", collection: "labs", id: item.id, subjectName: item.subjectName || "Lab" })}
                  downloaded={Boolean(downloads[`lab:${item.id}`])}
                  theme={theme}
                  dynamic={dynamic}
                />
              ) : null}
            </View>
          )}
        />
      ) : activeTab === "Updates" ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Latest updates</Text>
          {data.files.slice(0, 5).map((item) => <FileCard key={item.key} item={item} downloaded={Boolean(downloads[item.key])} isAdmin={profile?.role === "admin"} onOpen={() => openItem(item)} onRemove={() => removeLocal(item)} onDeleteWebsite={() => deleteFromWebsite(item)} theme={theme} dynamic={dynamic} />)}
          {data.notices.slice(0, 5).map((item) => (
            <View key={item.id} style={dynamic.card}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{item.text || "Notice"}</Text>
              <Text style={[styles.muted, { color: theme.muted }]}>{item.date ? new Date(item.date).toLocaleString() : "Notice"}</Text>
            </View>
          ))}
        </ScrollView>
      ) : activeTab === "Manager" ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={dynamic.card}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Manager Panel</Text>
            <Text style={[styles.muted, { color: theme.muted }]}>You can update files, routine, and calendar from the Acadex website manager tools.</Text>
          </View>
          <View style={styles.metrics}>
            <Metric label="Subjects" value={data.subjects.length} theme={theme} dynamic={dynamic} />
            <Metric label="Files" value={data.files.length} theme={theme} dynamic={dynamic} />
            <Metric label="Classes" value={data.routines.length} theme={theme} dynamic={dynamic} />
            <Metric label="Events" value={data.exams.length} theme={theme} dynamic={dynamic} />
          </View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Manager sections</Text>
          {["Subject", "Routine", "Calendar"].map((key) => (
            <Pressable key={key} onPress={() => changeSection(key)} style={dynamic.card}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{key}</Text>
              <Text style={[styles.muted, { color: theme.muted }]}>Open {key.toLowerCase()} workspace</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : activeTab === "Settings" ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={dynamic.card}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Profile</Text>
            <Text style={[styles.muted, { color: theme.muted }]}>{profile?.loginId || profile?.phone || profile?.email}</Text>
            <Text style={[styles.muted, { color: theme.muted }]}>Role: {profile?.role || "user"}</Text>
          </View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Theme</Text>
          {Object.entries(themes).map(([key, value]) => (
            <Pressable key={key} onPress={() => setThemeName(key)} style={[dynamic.card, themeName === key && { borderColor: value.accent, borderWidth: 2 }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{value.label}</Text>
              <View style={styles.swatches}>
                {[value.base, value.accent, value.accent2, value.cardStrong].map((color) => <View key={color} style={[styles.swatch, { backgroundColor: color }]} />)}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <FlatList contentContainerStyle={styles.content} data={downloadedItems} keyExtractor={(item) => item.key} renderItem={({ item }) => <FileCard item={item} downloaded isAdmin={profile?.role === "admin"} onOpen={() => openItem(item)} onRemove={() => removeLocal(item)} onDeleteWebsite={() => deleteFromWebsite(item)} theme={theme} dynamic={dynamic} />} />
      )}
      </Animated.View>

      <AppDrawer
        open={drawerOpen}
        activeTab={activeTab}
        onClose={() => setDrawerOpen(false)}
        onNavigate={(key) => {
          setDrawerOpen(false);
          changeSection(key);
        }}
        profile={profile}
        theme={theme}
        dynamic={dynamic}
      />
      <SearchOverlay
        open={searchOpen}
        query={searchQuery}
        setQuery={setSearchQuery}
        results={searchResults}
        onClose={() => setSearchOpen(false)}
        onOpenResult={openSearchResult}
        keyboardHeight={keyboardHeight}
        theme={theme}
        dynamic={dynamic}
      />
      {message ? <Text style={dynamic.footerMessage}>{message}</Text> : null}
      <BottomNav activeTab={activeTab} searchOpen={searchOpen} onNavigate={changeSection} theme={theme} dynamic={dynamic} />
    </SafeAreaView>
  );
}

function BrandMark({ theme }) {
  return (
    <View style={[styles.brandMark, { borderColor: "rgba(255,255,255,0.22)", backgroundColor: theme.cardStrong }]}>
      <Image source={require("./assets/icon.png")} resizeMode="cover" style={styles.brandMarkImage} />
    </View>
  );
}

function AppDrawer({ open, activeTab, onClose, onNavigate, profile, theme, dynamic }) {
  if (!open) return null;
  const items = profile?.role === "manager" ? [{ key: "Manager", label: "Manager Panel", icon: "M" }, ...drawerItems] : drawerItems;
  return (
    <View style={styles.drawerLayer}>
      <Pressable style={styles.drawerBackdrop} onPress={onClose} />
      <View style={dynamic.drawerPanel}>
        <View style={styles.drawerHeader}>
          <View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Acadex menu</Text>
            <Text style={[styles.muted, { color: theme.muted }]}>More sections</Text>
          </View>
          <Pressable onPress={onClose} style={dynamic.closeButton}>
            <Text style={{ color: theme.text, fontWeight: "900" }}>Close</Text>
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerList}>
          {items.map((item) => {
            const active = activeTab === item.key;
            return (
              <Pressable key={item.key} onPress={() => onNavigate(item.key)} style={[dynamic.drawerItem, active && dynamic.drawerItemActive]}>
                <Text style={[styles.bottomNavIcon, { color: active ? "#fff" : theme.accent2 }]}>{item.icon}</Text>
                <Text style={[styles.drawerLabel, { color: active ? "#fff" : theme.text }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

function SearchOverlay({ open, query, setQuery, results, onClose, onOpenResult, keyboardHeight, theme, dynamic }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(() => inputRef.current?.focus?.(), 120);
    return () => clearTimeout(timer);
  }, [open]);

  if (!open) return null;
  return (
    <View pointerEvents="box-none" style={styles.searchLayer}>
      <Pressable style={styles.searchBackdrop} onPress={onClose} />
      <View style={[dynamic.searchPanel, { bottom: Math.max(112, keyboardHeight + 18) }]}>
        <View style={dynamic.searchInputWrap}>
          <Text style={[styles.bottomNavIcon, { color: theme.accent2 }]}>Q</Text>
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search files, teachers, notices..."
            placeholderTextColor={theme.muted}
            style={dynamic.searchInput}
            returnKeyType="search"
          />
          {query ? (
            <Pressable onPress={() => setQuery("")}>
              <Text style={[styles.clearText, { color: theme.muted }]}>Clear</Text>
            </Pressable>
          ) : null}
        </View>
        {query.trim() ? (
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={styles.searchResults}>
            {results.length ? (
              results.map((result) => (
                <Pressable key={result.key} onPress={() => onOpenResult(result)} style={dynamic.searchResult}>
                  <Text style={[styles.searchResultType, { color: theme.accent2 }]}>{result.type}</Text>
                  <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{result.title}</Text>
                  <Text style={[styles.muted, { color: theme.muted }]} numberOfLines={1}>{result.subtitle}</Text>
                </Pressable>
              ))
            ) : (
              <Text style={[styles.muted, { color: theme.muted, padding: 12 }]}>No result found.</Text>
            )}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

function BottomNav({ activeTab, searchOpen, onNavigate, theme, dynamic }) {
  return (
    <View style={dynamic.bottomNavWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bottomNavContent}>
        {navItems.map((item) => {
          const active = item.key === "Search" ? searchOpen : activeTab === item.key;
          return (
            <Pressable key={item.key} onPress={() => onNavigate(item.key)} style={[dynamic.bottomNavItem, active && dynamic.bottomNavItemActive]}>
              <Text style={[styles.bottomNavIcon, { color: active ? "#fff" : theme.muted }]}>{item.icon}</Text>
              <Text style={[styles.bottomNavLabel, { color: active ? "#fff" : theme.muted }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function Metric({ label, value, theme, dynamic }) {
  return (
    <View style={dynamic.metric}>
      <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.muted, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

function Empty({ label, theme, dynamic }) {
  return (
    <View style={dynamic.card}>
      <Text style={[styles.muted, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

function RoutineCard({ routine, theme, dynamic }) {
  return (
    <View style={dynamic.card}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>{routine.subjectName}</Text>
      <Text style={[styles.muted, { color: theme.muted }]}>{routine.startTime}{routine.endTime ? ` - ${routine.endTime}` : ""}</Text>
      <Text style={[styles.muted, { color: theme.muted }]}>{routine.teacherName || "Teacher not selected"}{routine.room ? ` - ${routine.room}` : ""}</Text>
    </View>
  );
}

function TeacherCard({ teacher, subjects, theme, dynamic }) {
  const subjectMap = new Map(subjects.map((subject) => [subject.id, subject.name]));
  const names = (teacher.subjectIds || []).map((id) => subjectMap.get(id)).filter(Boolean);
  return (
    <View style={dynamic.card}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>{teacher.name || "Teacher"}</Text>
      <Text style={[styles.muted, { color: theme.muted }]}>{teacher.designation || "Faculty member"}</Text>
      {teacher.email ? <Text style={[styles.muted, { color: theme.muted }]}>{teacher.email}</Text> : null}
      <View style={styles.chipRow}>
        {names.length ? names.map((name) => <Text key={name} style={[styles.chip, { color: theme.text, backgroundColor: theme.cardStrong }]}>{name}</Text>) : <Text style={[styles.chip, { color: theme.text, backgroundColor: theme.cardStrong }]}>No subject assigned</Text>}
      </View>
    </View>
  );
}

function CalendarCard({ event, theme, dynamic }) {
  return (
    <View style={dynamic.card}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>{event.title || "Calendar event"}</Text>
      <Text style={[styles.muted, { color: theme.muted }]}>{(event.kind || "exam") === "event" ? "Event" : "Exam"} - {event.subjectName || "General"}</Text>
      <Text style={[styles.muted, { color: theme.muted }]}>{event.examDate ? new Date(event.examDate).toDateString() : "No date"}{event.startTime ? ` - ${event.startTime}` : ""}</Text>
      {event.room ? <Text style={[styles.muted, { color: theme.muted }]}>Room: {event.room}</Text> : null}
      {event.note ? <Text style={[styles.muted, { color: theme.muted }]}>{event.note}</Text> : null}
    </View>
  );
}

function MonthCalendar({ events, theme, dynamic }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const eventDays = new Set(events.map((event) => new Date(event.examDate).getDate()).filter(Boolean));
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  return (
    <View style={dynamic.card}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>{now.toLocaleString("default", { month: "long" })} {year}</Text>
      <View style={styles.calendarGrid}>
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <Text key={`${day}-${index}`} style={[styles.calendarLabel, { color: theme.muted }]}>{day}</Text>)}
        {cells.map((day, index) => (
          <View key={`${day || "blank"}-${index}`} style={[styles.calendarCell, { backgroundColor: day && eventDays.has(day) ? theme.accent : theme.cardStrong }]}>
            <Text style={{ color: theme.text, fontWeight: "800" }}>{day || ""}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function MiniFile({ item, downloaded, onPress, theme, dynamic }) {
  return (
    <Pressable onPress={onPress} style={dynamic.miniFile}>
      <Text style={[styles.miniTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
      <Text style={[styles.badge, { color: theme.accent2 }]}>{downloaded ? "Ready" : "Syncing"}</Text>
    </Pressable>
  );
}

function FileCard({ item, downloaded, isAdmin, onOpen, onRemove, onDeleteWebsite, theme, dynamic }) {
  return (
    <View style={dynamic.card}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
      <Text style={[styles.muted, { color: theme.muted }]}>{item.subjectName} - {extensionFrom(item).toUpperCase() || "FILE"} - {downloaded ? "Downloaded" : "Syncing"}</Text>
      <View style={styles.row}>
        <Pressable onPress={onOpen} style={dynamic.smallButton}>
          <Text style={styles.primaryButtonText}>Open inside app</Text>
        </Pressable>
        <Pressable onPress={onRemove} style={dynamic.ghostButton}>
          <Text style={[styles.ghostText, { color: theme.text }]}>Delete local</Text>
        </Pressable>
        {isAdmin ? (
          <Pressable onPress={onDeleteWebsite} style={dynamic.dangerButton}>
            <Text style={styles.dangerText}>Delete website</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function makeDynamicStyles(theme) {
  return StyleSheet.create({
    shell: {
      flex: 1,
      backgroundColor: theme.base,
      paddingTop: Platform.OS === "android" ? Math.max(RNStatusBar.currentHeight || 0, 18) : 0
    },
    input: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
      backgroundColor: theme.card,
      color: theme.text,
      paddingHorizontal: 18,
      paddingVertical: 15,
      fontSize: 16
    },
    primaryButton: {
      alignItems: "center",
      borderRadius: 22,
      backgroundColor: theme.accent,
      paddingVertical: 15,
      shadowColor: theme.accent,
      shadowOpacity: 0.4,
      shadowRadius: 18,
      elevation: 6
    },
    syncButton: {
      minWidth: 74,
      alignItems: "center",
      borderRadius: 18,
      backgroundColor: theme.cardStrong,
      paddingVertical: 10,
      paddingHorizontal: 14
    },
    menuButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 18,
      backgroundColor: theme.cardStrong,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.16)"
    },
    tab: {
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginRight: 8,
      backgroundColor: theme.card
    },
    activeTab: {
      backgroundColor: theme.accent
    },
    metric: {
      width: "47%",
      borderRadius: 24,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.15)",
      padding: 16
    },
    card: {
      borderRadius: 24,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.15)",
      padding: 16,
      gap: 8
    },
    miniFile: {
      borderRadius: 16,
      backgroundColor: theme.cardStrong,
      padding: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center"
    },
    smallButton: {
      borderRadius: 16,
      backgroundColor: theme.accent,
      paddingVertical: 10,
      paddingHorizontal: 12
    },
    ghostButton: {
      borderRadius: 16,
      backgroundColor: theme.cardStrong,
      paddingVertical: 10,
      paddingHorizontal: 12
    },
    dangerButton: {
      borderRadius: 16,
      backgroundColor: "rgba(239,68,68,0.22)",
      paddingVertical: 10,
      paddingHorizontal: 12
    },
    footerMessage: {
      position: "absolute",
      left: 14,
      right: 14,
      bottom: 104,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: theme.cardStrong,
      color: theme.text,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 12
    },
    bottomNavWrap: {
      position: "absolute",
      left: 12,
      right: 12,
      bottom: 16,
      borderRadius: 34,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
      backgroundColor: theme.cardStrong,
      paddingVertical: 8,
      paddingHorizontal: 8,
      shadowColor: theme.accent,
      shadowOpacity: 0.25,
      shadowRadius: 22,
      elevation: 12
    },
    bottomNavItem: {
      minWidth: 68,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 26,
      paddingVertical: 7,
      paddingHorizontal: 8
    },
    bottomNavItemActive: {
      backgroundColor: theme.accent
    },
    closeButton: {
      borderRadius: 16,
      backgroundColor: theme.cardStrong,
      paddingVertical: 10,
      paddingHorizontal: 14
    },
    drawerPanel: {
      position: "absolute",
      left: 14,
      top: Platform.OS === "android" ? Math.max(RNStatusBar.currentHeight || 0, 18) + 10 : 24,
      bottom: 14,
      width: Math.min(320, Dimensions.get("window").width - 28),
      borderRadius: 28,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
      backgroundColor: theme.cardStrong,
      padding: 16
    },
    drawerItem: {
      borderRadius: 20,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)",
      paddingHorizontal: 14,
      paddingVertical: 13,
      flexDirection: "row",
      alignItems: "center",
      gap: 12
    },
    drawerItemActive: {
      backgroundColor: theme.accent,
      borderColor: theme.accent
    },
    searchPanel: {
      position: "absolute",
      left: 14,
      right: 14,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
      backgroundColor: theme.cardStrong,
      padding: 12,
      shadowColor: theme.accent,
      shadowOpacity: 0.28,
      shadowRadius: 24,
      elevation: 18
    },
    searchInputWrap: {
      borderRadius: 22,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.16)",
      paddingHorizontal: 14,
      paddingVertical: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 10
    },
    searchInput: {
      flex: 1,
      color: theme.text,
      fontSize: 16,
      paddingVertical: 8
    },
    searchResult: {
      borderRadius: 20,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)",
      padding: 13,
      marginBottom: 8
    },
    textPreview: {
      flex: 1,
      margin: 16,
      borderRadius: 22,
      backgroundColor: theme.card
    }
  });
}

const styles = StyleSheet.create({
  blob: {
    position: "absolute",
    left: -120,
    top: 40,
    borderRadius: 999
  },
  login: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 14
  },
  brand: {
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  brandSmall: {
    fontSize: 30,
    fontWeight: "900"
  },
  loginSubtitle: {
    fontSize: 16,
    marginBottom: 10
  },
  disabled: {
    opacity: 0.7
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800"
  },
  message: {
    lineHeight: 20
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  menuIcon: {
    fontSize: 22,
    fontWeight: "900"
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  brandMarkImage: {
    width: "100%",
    height: "100%"
  },
  brandMarkOrb: {
    position: "absolute",
    right: -8,
    top: -8,
    width: 26,
    height: 26,
    borderRadius: 13,
    opacity: 0.82
  },
  brandMarkText: {
    fontSize: 24,
    fontWeight: "900"
  },
  syncText: {
    fontWeight: "800"
  },
  tabs: {
    paddingLeft: 14,
    paddingBottom: 8
  },
  tabText: {
    fontWeight: "800"
  },
  content: {
    padding: 16,
    paddingBottom: 156,
    gap: 12
  },
  screenTransition: {
    flex: 1
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  metricValue: {
    fontSize: 30,
    fontWeight: "900"
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: 12
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "900"
  },
  muted: {
    lineHeight: 20
  },
  miniTitle: {
    flex: 1,
    marginRight: 10
  },
  badge: {
    fontSize: 12,
    fontWeight: "900"
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8
  },
  ghostText: {
    fontWeight: "800"
  },
  dangerText: {
    color: "#fecaca",
    fontWeight: "800"
  },
  viewerHeader: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  viewerTitle: {
    fontSize: 18,
    fontWeight: "900",
    maxWidth: 250
  },
  previewImage: {
    flex: 1,
    width: "100%"
  },
  webPreview: {
    flex: 1,
    backgroundColor: "#111827"
  },
  textPreviewContent: {
    padding: 16,
    lineHeight: 22
  },
  swatches: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8
  },
  bottomNavContent: {
    gap: 6,
    paddingHorizontal: 2
  },
  bottomNavIcon: {
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 20
  },
  bottomNavLabel: {
    fontSize: 10,
    fontWeight: "800",
    marginTop: 1
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8
  },
  chip: {
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "800"
  },
  drawerLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.36)"
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 14
  },
  drawerList: {
    gap: 10,
    paddingBottom: 24
  },
  drawerLabel: {
    fontSize: 16,
    fontWeight: "900"
  },
  searchLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40
  },
  searchBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)"
  },
  searchResults: {
    maxHeight: 300,
    marginTop: 10
  },
  searchResultType: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase"
  },
  clearText: {
    fontSize: 12,
    fontWeight: "900"
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12
  },
  calendarLabel: {
    width: "13%",
    textAlign: "center",
    fontWeight: "900"
  },
  calendarCell: {
    width: "13%",
    aspectRatio: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)"
  }
});
