import logo from "./assets/logo1.png";
import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { db } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import noticeImg from "./assets/notice1.png";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [leaveSearch, setLeaveSearch] = useState("");
  const [showNotice, setShowNotice] = useState(true);
  const [fadeNotice, setFadeNotice] = useState(false);
  const [staffGroups, setStaffGroups] = useState([]);
  const [groupForm, setGroupForm] = useState({ name: "", members: [] });
  const [yaumiyyaUnlocked, setYaumiyyaUnlocked] = useState(false);
  const [yaumiyyaPassword, setYaumiyyaPassword] = useState("");
  const [imaamUnlocked, setImaamUnlocked] = useState(false);
  const [imaamPassword, setImaamPassword] = useState("");

  const [hukuruUnlocked, setHukuruUnlocked] = useState(false);
  const [hukuruPassword, setHukuruPassword] = useState("");

  const [imaams, setImaams] = useState([]);
  const [imaamForm, setImaamForm] = useState({ name: "" });
  const [hukuruStatusOptions, setHukuruStatusOptions] = useState([]);
  const [statusOptionForm, setStatusOptionForm] = useState({ label: "" });
  const [showHukuruEditor, setShowHukuruEditor] = useState(true);
  const [showHukuruCalendar, setShowHukuruCalendar] = useState(false);
  const [randomHukuruSelection, setRandomHukuruSelection] = useState([]);

const formatLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const getInitialHukuruFriday = () => {
  const d = new Date();

  while (d.getDay() !== 5) {
    d.setDate(d.getDate() + 1);
  }

  return formatLocalDateString(d);
};

const [hukuruDate, setHukuruDate] = useState(getInitialHukuruFriday());

const [hukuruRecord, setHukuruRecord] = useState({
  isthiqaama: {
    imaam: { name: "", accepted: "" },
    badhalImaam: { name: "", accepted: "" }
  },
  rilwaan: {
    imaam: { name: "", accepted: "" },
    badhalImaam: { name: "", accepted: "" }
  },
  vaguthee: {
    imaam: { name: "", accepted: "" },
    badhalImaam: { name: "", accepted: "" }
  }
});
  const [employees, setEmployees] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [leaves, setLeaves] = useState([]);
  const [settings] = useState({ excludeFriday: true, excludeSaturday: true });
  const [publicHolidays, setPublicHolidays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [leaveCheckDate, setLeaveCheckDate] = useState(
  new Date().toISOString().split("T")[0]
);
  const [yaumiyyaDate, setYaumiyyaDate] = useState(
  new Date().toISOString().split("T")[0]
);

const [yaumiyyaForm, setYaumiyyaForm] = useState({
  annualLeave: "",
  familyLeave: "",
  sickLeaveMC: "",
  sickLeaveNoMC: ""
});

const [yaumiyyaRecord, setYaumiyyaRecord] = useState({
  annualLeave: [],
  familyLeave: [],
  sickLeaveMC: [],
  sickLeaveNoMC: []
});

  const [empForm, setEmpForm] = useState({ name: "", designation: "", section: "", supervisor: "" });
  const [leaveForm, setLeaveForm] = useState({ employee: "", start: "", end: "" });
  const [holidayForm, setHolidayForm] = useState({ name: "", date: "" });
  const [dirFilter, setDirFilter] = useState({ section: "", supervisor: "" });

  const [isLoading, setIsLoading] = useState(false); 
useEffect(() => {
  const fadeTimer = setTimeout(() => {
    setFadeNotice(true); // start fade
  }, 6000); // start fading at 4s

  const hideTimer = setTimeout(() => {
    setShowNotice(false); // fully remove
  }, 7000); // remove at 5s

  return () => {
    clearTimeout(fadeTimer);
    clearTimeout(hideTimer);
  };
}, []);

  // --- DATA LOADING ---
  const refreshData = async () => {
    try {
      const empSnap = await getDocs(collection(db, "employees"));
      setEmployees(empSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      const imaamSnap = await getDocs(collection(db, "imaams"));
      setImaams(imaamSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      const statusSnap = await getDocs(collection(db, "hukuruStatusOptions"));
      setHukuruStatusOptions(statusSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      

      const leaveSnap = await getDocs(collection(db, "leaves"));
      setLeaves(leaveSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const groupSnap = await getDocs(collection(db, "staffGroups"));
      setStaffGroups(groupSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // NEW: Fetch holidays from Firebase
      const holidaySnap = await getDocs(collection(db, "holidays"));
      setPublicHolidays(holidaySnap.docs.map((d) => ({ id: d.id, ...d.data() })));

    } catch (e) {
      console.error("Firebase sync error. Is Firestore enabled?", e);
      alert("Error loading data. Please check if your Firebase Database is set up.");
    }
  };

  useEffect(() => {
  refreshData();
}, []);

  const closeSidebarAndGo = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  // --- LOGIC ---
  const closestLeaves = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return [...leaves]
      .filter((l) => l.start && l.start > today)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 6);
  }, [leaves]);

  const holidayDateSet = useMemo(
    () => new Set(publicHolidays.map((h) => h.date)),
    [publicHolidays]
  );

const renderCalendarDays = () => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split("T")[0];

  const cells = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="cal-day empty"></div>);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayOfWeek = new Date(year, month, d).getDay();

    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    const isHoliday = holidayDateSet.has(dateStr);
    const isToday = todayStr === dateStr;

    let className = "cal-day";
    if (isWeekend || isHoliday) className += " cal-red";
    if (isToday) className += " cal-today";
    if (selectedDate === dateStr) className += " cal-selected";

    cells.push(
      <div
        key={dateStr}
        className={className}
        onClick={() => setSelectedDate(dateStr)}
        style={{ cursor: "pointer" }}
      >
        {d}
      </div>
    );
  }
  return cells;
};

  const changeMonth = (offset) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  // State to hold the data for the pop-up modal
  const [overlapModalData, setOverlapModalData] = useState(null);
  const [groupModalData, setGroupModalData] = useState(null);

  // Math logic to check if two date ranges intersect
  const checkOverlap = (start1, end1, start2, end2) => {
    return start1 <= end2 && start2 <= end1;
  };

  // Function fired when the button is clicked
  const viewOverlaps = (targetLeave) => {
    // Filter out the exact leave we clicked on, and find the ones that overlap
    const overlaps = leaves.filter((l) => 
      l.id !== targetLeave.id && checkOverlap(targetLeave.start, targetLeave.end, l.start, l.end)
    );
    // Trigger the modal to open with the results
    setOverlapModalData({ target: targetLeave, overlaps });
  };

  const closeOverlapModal = () => setOverlapModalData(null);

  const openGroupModal = (group) => {
  setGroupModalData(group);
};

const closeGroupModal = () => {
  setGroupModalData(null);
};

  // --- ACTIONS ---
  const saveEmployee = async (e) => {
    e.preventDefault(); 
    const safeName = (empForm.name || "").trim();
    const safeSection = (empForm.section || "").trim();

    if (!safeName || !safeSection) {
      return alert("Please fill in both Name and Section.");
    }

    setIsLoading(true);
    try {
      const payload = {
        name: safeName,
        designation: (empForm.designation || "").trim(),
        section: safeSection,
        supervisor: (empForm.supervisor || "").trim()
      };

      const docRef = await addDoc(collection(db, "employees"), payload);
      setEmployees((prev) => [...prev, { id: docRef.id, ...payload }]);
      setEmpForm({ name: "", designation: "", section: "", supervisor: "" });
      alert("Staff registered successfully!");
    } catch (error) {
      console.error("Firebase write error:", error);
      alert(`Could not save to Firebase: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Delete Employee
  const removeEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    try {
      if (id) await deleteDoc(doc(db, "employees", id));
      setEmployees((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      alert("Could not delete employee record.");
    }
  };

  const saveLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.employee || !leaveForm.start || !leaveForm.end) {
      return alert("Please select employee, start date, and end date.");
    }
    if (leaveForm.end < leaveForm.start) {
      return alert("End date cannot be before start date.");
    }

    setIsLoading(true);
    try {
      const payload = { employee: leaveForm.employee, start: leaveForm.start, end: leaveForm.end };
      const docRef = await addDoc(collection(db, "leaves"), payload);
      setLeaves((prev) => [...prev, { id: docRef.id, ...payload }]);
      setLeaveForm({ employee: "", start: "", end: "" });
      alert("Leave added successfully!");
    } catch (error) {
      console.error("Error saving leave:", error);
      alert(`Could not save leave: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const removeLeave = async (id) => {
    if (!window.confirm("Are you sure you want to delete this leave record?")) return;
    try {
      if (id) await deleteDoc(doc(db, "leaves", id));
      setLeaves((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      alert("Could not delete leave record.");
    }
  };

  // UPDATED: Save Holiday to Firebase
  const addHoliday = async (e) => {
    e.preventDefault();
    const safeName = (holidayForm.name || "").trim();
    if (!safeName || !holidayForm.date) return alert("Please enter holiday name and date.");
    
    setIsLoading(true);
    try {
      const payload = { name: safeName, date: holidayForm.date };
      const docRef = await addDoc(collection(db, "holidays"), payload);
      setPublicHolidays((prev) => [...prev, { id: docRef.id, ...payload }]);
      setHolidayForm({ name: "", date: "" });
    } catch (error) {
      console.error("Error saving holiday:", error);
      alert(`Could not save holiday: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Delete Holiday
  const removeHoliday = async (id) => {
    if (!window.confirm("Are you sure you want to delete this public holiday?")) return;
    try {
      if (id) await deleteDoc(doc(db, "holidays", id));
      setPublicHolidays((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      alert("Could not delete holiday record.");
    }
  };
const saveGroup = async (e) => {
  e.preventDefault();

  const safeName = (groupForm.name || "").trim();
  if (!safeName) return alert("Please enter a group name.");
  if (groupForm.members.length === 0) return alert("Please select at least one staff member.");

  setIsLoading(true);
  try {
    const payload = {
      name: safeName,
      members: groupForm.members
    };

    const docRef = await addDoc(collection(db, "staffGroups"), payload);
    setStaffGroups((prev) => [...prev, { id: docRef.id, ...payload }]);
    setGroupForm({ name: "", members: [] });
    alert("Staff group created successfully!");
  } catch (error) {
    console.error("Error saving group:", error);
    alert(`Could not save group: ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};
const removeGroup = async (id) => {
  if (!window.confirm("Are you sure you want to delete this group?")) return;
  try {
    if (id) await deleteDoc(doc(db, "staffGroups", id));
    setStaffGroups((prev) => prev.filter((item) => item.id !== id));
  } catch (error) {
    alert("Could not delete group.");
  }
};
const loadYaumiyya = async (date) => {
  try {
    const ref = doc(db, "yaumiyya", date);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      setYaumiyyaRecord({
  annualLeave: snap.data().annualLeave || [],
  familyLeave: snap.data().familyLeave || [],
  sickLeaveMC: snap.data().sickLeaveMC || [],
  sickLeaveNoMC: snap.data().sickLeaveNoMC || []
});
    } else {
      setYaumiyyaRecord({
  annualLeave: [],
  familyLeave: [],
  sickLeaveMC: [],
  sickLeaveNoMC: []
});
    }
  } catch (error) {
    console.error("Error loading Yaumiyya:", error);
  }
};

useEffect(() => {
  loadYaumiyya(yaumiyyaDate);
}, [yaumiyyaDate]);

const saveYaumiyyaRecord = async (nextRecord) => {
  try {
    await setDoc(doc(db, "yaumiyya", yaumiyyaDate), {
      date: yaumiyyaDate,
      ...nextRecord
    });
  } catch (error) {
    console.error("Error saving Yaumiyya:", error);
    alert("Could not save Yaumiyya record.");
  }
};

const addYaumiyyaStaff = async (type) => {
  const selectedStaff = yaumiyyaForm[type];

  if (!selectedStaff) return alert("Please select a staff member.");

  if (yaumiyyaRecord[type].includes(selectedStaff)) {
    return alert("This staff member is already added to this category.");
  }

  const nextRecord = {
    ...yaumiyyaRecord,
    [type]: [...yaumiyyaRecord[type], selectedStaff]
  };

  setYaumiyyaRecord(nextRecord);
  setYaumiyyaForm({ ...yaumiyyaForm, [type]: "" });
  await saveYaumiyyaRecord(nextRecord);
};

const removeYaumiyyaStaff = async (type, staffName) => {
  const nextRecord = {
    ...yaumiyyaRecord,
    [type]: yaumiyyaRecord[type].filter((name) => name !== staffName)
  };

  setYaumiyyaRecord(nextRecord);
  await saveYaumiyyaRecord(nextRecord);
};
const saveImaam = async (e) => {
  e.preventDefault();

  const safeName = (imaamForm.name || "").trim();
  if (!safeName) return alert("Please enter Imaam name.");

  setIsLoading(true);
  try {
    const payload = { name: safeName };
    const docRef = await addDoc(collection(db, "imaams"), payload);

    setImaams((prev) => [...prev, { id: docRef.id, ...payload }]);
    setImaamForm({ name: "" });
    alert("Imaam added successfully!");
  } catch (error) {
    console.error("Error saving Imaam:", error);
    alert("Could not save Imaam.");
  } finally {
    setIsLoading(false);
  }
};

const removeImaam = async (id) => {
  if (!window.confirm("Are you sure you want to delete this Imaam?")) return;

  try {
    if (id) await deleteDoc(doc(db, "imaams", id));
    setImaams((prev) => prev.filter((item) => item.id !== id));
  } catch (error) {
    alert("Could not delete Imaam.");
  }
};
const saveStatusOption = async (e) => {
  e.preventDefault();

  const safeLabel = (statusOptionForm.label || "").trim();
  if (!safeLabel) return alert("Please enter a status option.");

  setIsLoading(true);
  try {
    const payload = { label: safeLabel };
    const docRef = await addDoc(collection(db, "hukuruStatusOptions"), payload);

    setHukuruStatusOptions((prev) => [...prev, { id: docRef.id, ...payload }]);
    setStatusOptionForm({ label: "" });
    alert("Status option added successfully!");
  } catch (error) {
    console.error("Error saving status option:", error);
    alert("Could not save status option.");
  } finally {
    setIsLoading(false);
  }
};

const removeStatusOption = async (id) => {
  if (!window.confirm("Delete this status option?")) return;

  try {
    if (id) await deleteDoc(doc(db, "hukuruStatusOptions", id));
    setHukuruStatusOptions((prev) => prev.filter((item) => item.id !== id));
  } catch (error) {
    alert("Could not delete status option.");
  }
};
const pickRandomFrom = (list) => {
  if (!list || list.length === 0) return "";
  return list[Math.floor(Math.random() * list.length)];
};

const generateRandomHukuruSelection = async () => {
  if (imaams.length < 2) {
    return alert("Please add at least 2 Imaams before generating.");
  }

  const previousFriday = getPrevFriday(hukuruDate);

  let previousRecord = emptyHukuruRecord;

  try {
    const ref = doc(db, "hukuru2026", previousFriday);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      previousRecord = snap.data().record || emptyHukuruRecord;
    }
  } catch (error) {
    console.error("Error loading previous Hukuru:", error);
  }

  const mosques = [
    { key: "isthiqaama", title: "Masjidh Isthiqaama" },
    { key: "rilwaan", title: "Masjidh Rilwaan" },
    { key: "vaguthee", title: "Masjidh Vaguthee" }
  ];

  const imaamNames = imaams.map((item) => item.name).filter(Boolean);

  const results = mosques.map((mosque) => {
    const previousImaam = previousRecord[mosque.key]?.imaam?.name || "";
    const previousBadhal = previousRecord[mosque.key]?.badhalImaam?.name || "";

    const blockedNames = [previousImaam, previousBadhal].filter(Boolean);

    let availableForImaam = imaamNames.filter(
      (name) => !blockedNames.includes(name)
    );

    if (availableForImaam.length === 0) {
      availableForImaam = imaamNames;
    }

    const selectedImaam = pickRandomFrom(availableForImaam);

    let availableForBadhal = imaamNames.filter(
      (name) =>
        name !== selectedImaam &&
        !blockedNames.includes(name)
    );

    if (availableForBadhal.length === 0) {
      availableForBadhal = imaamNames.filter((name) => name !== selectedImaam);
    }

    const selectedBadhal = pickRandomFrom(availableForBadhal);

    return {
      mosqueKey: mosque.key,
      mosque: mosque.title,
      previousImaam: previousImaam || "—",
      previousBadhal: previousBadhal || "—",
      randomImaam: selectedImaam || "—",
      randomBadhal: selectedBadhal || "—"
    };
  });

  setRandomHukuruSelection(results);
};

const emptyHukuruRecord = {
  isthiqaama: {
    imaam: { name: "", accepted: "" },
    badhalImaam: { name: "", accepted: "" }
  },
  rilwaan: {
    imaam: { name: "", accepted: "" },
    badhalImaam: { name: "", accepted: "" }
  },
  vaguthee: {
    imaam: { name: "", accepted: "" },
    badhalImaam: { name: "", accepted: "" }
  }
};

const loadHukuru = async (date) => {
  try {
    const ref = doc(db, "hukuru2026", date);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      setHukuruRecord(snap.data().record || emptyHukuruRecord);
    } else {
      setHukuruRecord(emptyHukuruRecord);
    }
  } catch (error) {
    console.error("Error loading Hukuru:", error);
  }
};

useEffect(() => {
  loadHukuru(hukuruDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [hukuruDate]);

const saveHukuruRecord = async (nextRecord) => {
  try {
    await setDoc(doc(db, "hukuru2026", hukuruDate), {
      date: hukuruDate,
      record: nextRecord
    });
  } catch (error) {
    console.error("Error saving Hukuru:", error);
    alert("Could not save Hukuru record.");
  }
};

const updateHukuruField = (mosqueKey, roleKey, field, value) => {
  const nextRecord = {
    ...hukuruRecord,
    [mosqueKey]: {
      ...hukuruRecord[mosqueKey],
      [roleKey]: {
        ...hukuruRecord[mosqueKey][roleKey],
        [field]: value
      }
    }
  };

  setHukuruRecord(nextRecord);
};

const handleSaveHukuruRecord = async () => {
  await saveHukuruRecord(hukuruRecord);
  alert("Hukuru 2026 record saved successfully!");
};
const getNextFriday = (baseDate) => {
  const d = new Date(`${baseDate}T00:00:00`);

  do {
    d.setDate(d.getDate() + 1);
  } while (d.getDay() !== 5);

  return formatLocalDateString(d);
};

const getPrevFriday = (baseDate) => {
  const d = new Date(`${baseDate}T00:00:00`);

  do {
    d.setDate(d.getDate() - 1);
  } while (d.getDay() !== 5);

  return formatLocalDateString(d);
};

const goNextHukuru = () => {
  setHukuruDate(getNextFriday(hukuruDate));
};

const goPrevHukuru = () => {
  setHukuruDate(getPrevFriday(hukuruDate));
};
const renderHukuruMiniCalendar = () => {
  const base = new Date(`${hukuruDate}T00:00:00`);
  const year = base.getFullYear();
  const month = base.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`hukuru-empty-${i}`} className="hukuru-mini-day empty"></div>);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayOfWeek = new Date(year, month, d).getDay();
    const isFriday = dayOfWeek === 5;
    const isSelected = hukuruDate === dateStr;

    cells.push(
      <button
        key={dateStr}
        type="button"
        className={`hukuru-mini-day ${isFriday ? "hukuru-friday" : ""} ${isSelected ? "hukuru-selected" : ""}`}
        disabled={!isFriday}
        onClick={() => {
          setHukuruDate(dateStr);
          setShowHukuruCalendar(false);
        }}
      >
        {d}
      </button>
    );
  }

  return cells;
};

  // --- FILTERS ---
const filteredEmployees = employees.filter((e) => {
  const sectionMatch = !dirFilter.section || e.section === dirFilter.section;

  const supervisorMatch =
    !dirFilter.supervisor ||
    (e.supervisor || "").toLowerCase().includes(dirFilter.supervisor.toLowerCase());

  const nameMatch =
    !employeeSearch ||
    (e.name || "").toLowerCase().includes(employeeSearch.toLowerCase());

  return sectionMatch && supervisorMatch && nameMatch;
});
const filteredLeaves = leaves.filter((l) =>
  (l.employee || "").toLowerCase().includes(leaveSearch.toLowerCase())
);
const calculateLeaveDays = (start, end) => {
  if (!start || !end) return 0;

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (endDate < startDate) return 0;

  const holidaySet = new Set(publicHolidays.map((h) => h.date));
  let count = 0;

  const current = new Date(startDate);

  while (current <= endDate) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    const dayOfWeek = current.getDay(); // 0=Sun, 5=Fri, 6=Sat
    const isFriday = dayOfWeek === 5;
    const isSaturday = dayOfWeek === 6;
    const isHoliday = holidaySet.has(dateStr);

    if (!isFriday && !isSaturday && !isHoliday) {
      count++;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
};
const getNextWorkingDay = (endDate) => {
  if (!endDate) return "";

  const holidaySet = new Set(publicHolidays.map((h) => h.date));
  const date = new Date(endDate);
  date.setDate(date.getDate() + 1);

  while (true) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2,"0");
    const day = String(date.getDate()).padStart(2,"0");
    const dateStr = `${year}-${month}-${day}`;

    const dayOfWeek = date.getDay();
    const isFriday = dayOfWeek === 5;
    const isSaturday = dayOfWeek === 6;
    const isHoliday = holidaySet.has(dateStr);

    if (!isFriday && !isSaturday && !isHoliday) {
      return dateStr;
    }

    date.setDate(date.getDate() + 1);
  }
};
const employeesOnSelectedDate = selectedDate
  ? leaves.filter((l) => l.start <= selectedDate && l.end >= selectedDate)
  : [];
const staffOnLeaveByDate = leaveCheckDate
  ? leaves.filter((l) => l.start <= leaveCheckDate && l.end >= leaveCheckDate)
  : [];
const selectedBaseDate = leaveCheckDate || new Date().toISOString().split("T")[0];

const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const tomorrowStr = (() => {
  const d = new Date(`${selectedBaseDate}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return formatDateLocal(d);
})();

const returningTomorrow = leaves.filter(
  (l) => getNextWorkingDay(l.end) === tomorrowStr
);

const returningThisWeek = leaves.filter((l) => {
  const returnDate = getNextWorkingDay(l.end);
  if (!returnDate) return false;

  const base = new Date(selectedBaseDate);
  const next7Days = new Date(selectedBaseDate);
  next7Days.setDate(next7Days.getDate() + 7);

  const rDate = new Date(returnDate);

  return rDate >= base && rDate <= next7Days;
});
const leaveTrendData = months.map((month, index) => {
  const count = leaves.filter((l) => {
    if (!l.start) return false;
    const leaveDate = new Date(l.start);
    return leaveDate.getMonth() === index;
  }).length;

  return { month, count };
});

const maxLeaveCount = Math.max(...leaveTrendData.map((m) => m.count), 1);
const isStaffOnLeaveToday = (staffName) => {
  const today = new Date().toISOString().split("T")[0];

  return leaves.some(
    (l) =>
      l.employee === staffName &&
      l.start <= today &&
      l.end >= today
  );
};
  return (
    <div className={`app-shell ${isSidebarOpen ? "sidebar-mobile-open" : ""}`}>
      {/* Sidebar Overlay */}
      <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>

<nav className="sidebar">
<div className="sidebar-brand">
  <div className="logo-icon">
    <img src={logo} alt="Funadhoo Council Logo" />
  </div>

  <div className="brand-text">
    <span className="brand-title">Funadhoo Council</span>
    <small className="brand-version">V4.0</small>
  </div>
</div>
        <ul className="nav-menu">
          <li className={activeTab === "home" ? "active" : ""} onClick={() => closeSidebarAndGo("home")}>Home</li>
          <li className={activeTab === "dashboard" ? "active" : ""} onClick={() => closeSidebarAndGo("dashboard")}>Visual Board</li>
          <li className={activeTab === "directory" ? "active" : ""} onClick={() => closeSidebarAndGo("directory")}>Staff Directory</li>
          <li className={activeTab === "imaam-directory" ? "active" : ""} onClick={() => closeSidebarAndGo("imaam-directory")}>Imaam Directory</li>
          <li className={activeTab === "records" ? "active" : ""} onClick={() => closeSidebarAndGo("records")}>Leave Records</li>
          <li className={activeTab === "staff-on-leave" ? "active" : ""} onClick={() => closeSidebarAndGo("staff-on-leave")}>Staff on Leave</li>
          <li className={activeTab === "leave-trend" ? "active" : ""} onClick={() => closeSidebarAndGo("leave-trend")}>Leave Trend</li>
          <li className={activeTab === "yaumiyya" ? "active" : ""} onClick={() => closeSidebarAndGo("yaumiyya")}>Yaumiyya</li>
          <li className={activeTab === "hukuru-2026" ? "active" : ""} onClick={() => closeSidebarAndGo("hukuru-2026")}>Hukuru 2026</li>
          <li className="nav-label">Administration</li>
          <li className={activeTab === "groups" ? "active" : ""} onClick={() => closeSidebarAndGo("groups")}>Staff Groups</li>
          <li className={activeTab === "admin" ? "active" : ""} onClick={() => closeSidebarAndGo("admin")}>Settings & Staff</li>
        </ul>
      </nav>

      <main className="main-content">
        <header className="main-header">
          <button className="burger-btn" onClick={() => setIsSidebarOpen(true)}>☰</button>
          <h1 className="page-title">{activeTab.replace("-", " ").toUpperCase()}</h1>
          <div className="user-profile">Latest Build: 2026/04/29 12:03</div>
        </header>

        <div className="content-area">
          {/* HOME TAB */}
          {activeTab === "home" && (
            <div className="home-grid">
{showNotice && (
  <div className={`calendar-notice ${fadeNotice ? "fade-out" : ""}`}>
    <img src={noticeImg} alt="Notice" />
  </div>
)}
<section className="panel">

<div className="flex-between mb-4">
  <h2>
    {months[viewDate.getMonth()]} {viewDate.getFullYear()}
  </h2>

  <div className="btn-group">
    <button type="button" onClick={() => changeMonth(-1)}>←</button>
    <button type="button" onClick={() => changeMonth(1)}>→</button>
  </div>
</div>

  <div className="calendar-box">
    <div className="cal-weekdays">
      {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
        <div key={d}>{d}</div>
      ))}
    </div>

    <div className="cal-grid">
      {renderCalendarDays()}
    </div>
  </div>

  {/* ✅ IMPORTANT: KEEP THIS INSIDE SECTION */}
  {selectedDate && (
    <div className="selected-date-panel">
      <h3>Leaves on {selectedDate}</h3>

      {employeesOnSelectedDate.length > 0 ? (
        employeesOnSelectedDate.map((leave) => (
          <div key={leave.id} className="closest-item">
            <div className="closest-info">
              <strong>{leave.employee}</strong>
              <span>
                {leave.start} to {leave.end}
              </span>
            </div>
          </div>
        ))
      ) : (
        <p className="muted">No employees are on leave on this date.</p>
      )}
    </div>
  )}

</section>

              <section className="panel">
                <div className="flex-between mb-4">
                  <h2>Closest Leaves</h2>
                  <button className="refresh-btn" onClick={refreshData}>Refresh</button>
                </div>
                <div className="closest-list">
                  {closestLeaves.map((l) => (
                    <div key={l.id} className="closest-item">
                      <div className="closest-info">
                        <strong>{l.employee}</strong>
                        <span>{l.start} to {l.end}</span>
                      </div>
                      <div className="closest-tag">Upcoming</div>
                    </div>
                  ))}
                  {closestLeaves.length === 0 && <p className="muted">No upcoming leave records.</p>}
                </div>
              </section>
            </div>
          )}

          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <div className="admin-grid">
              <section className="panel">
                <h2>Overview</h2>
                <div className="closest-item"><strong>Total Staff</strong><span>{employees.length}</span></div>
                <div className="closest-item"><strong>Total Leave Records</strong><span>{leaves.length}</span></div>
                <div className="closest-item"><strong>Public Holidays</strong><span>{publicHolidays.length}</span></div>
              </section>

              <section className="panel">
                <h2>Upcoming Leave Snapshot</h2>
                {closestLeaves.length > 0 ? (
                  closestLeaves.map((l) => (
                    <div key={l.id} className="closest-item">
                      <div><strong>{l.employee}</strong><div className="muted">{l.start} to {l.end}</div></div>
                    </div>
                  ))
                ) : <p className="muted">No upcoming leave records.</p>}
              </section>
            </div>
          )}

          {/* ADMIN TAB */}
          {activeTab === "admin" && (
            <div className="admin-grid">
              {/* Wrapped in a Form */}
              <form className="panel" onSubmit={saveEmployee}>
                <h2>Staff Registration</h2>
                <div className="form-stack">
                  <input required placeholder="Name *" value={empForm.name} onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })} />
                  <input placeholder="Designation" value={empForm.designation} onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })} />
                  <input required placeholder="Section (e.g. IT, HR) *" value={empForm.section} onChange={(e) => setEmpForm({ ...empForm, section: e.target.value })} />
                  <input placeholder="Supervisor Name" value={empForm.supervisor} onChange={(e) => setEmpForm({ ...empForm, supervisor: e.target.value })} />
                  <button type="submit" className="primary-btn" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Register Staff"}
                  </button>
                </div>
              </form>

              <form className="panel" onSubmit={saveLeave}>
                <h2>Add Leave Record</h2>
                <div className="form-stack">
                  <select required value={leaveForm.employee} onChange={(e) => setLeaveForm({ ...leaveForm, employee: e.target.value })}>
                    <option value="">Select employee *</option>
                    {employees.map((emp) => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                  </select>
                  <input required type="date" value={leaveForm.start} onChange={(e) => setLeaveForm({ ...leaveForm, start: e.target.value })} />
                  <input required type="date" value={leaveForm.end} onChange={(e) => setLeaveForm({ ...leaveForm, end: e.target.value })} />
                  <button type="submit" className="primary-btn" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Leave"}
                  </button>
                </div>
              </form>

              <div className="panel">
                <form onSubmit={addHoliday}>
                  <h2>Holiday & Weekend Policy</h2>
                  <div className="checkbox-group mb-4">
                    <label><input type="checkbox" checked={settings.excludeFriday} readOnly /> Exclude Fridays</label>
                    <label><input type="checkbox" checked={settings.excludeSaturday} readOnly /> Exclude Saturdays</label>
                  </div>
                  <h3>Add Public Holiday</h3>
                  <input required type="text" placeholder="Holiday Name *" className="mb-2 mt-2" value={holidayForm.name} onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })} />
                  <input required type="date" className="mb-2" value={holidayForm.date} onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })} />
                  <button type="submit" className="primary-btn" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Add to Calendar"}
                  </button>
                </form>
                
                {/* NEW: Display Public Holidays so they can be deleted */}
                <h3 className="mt-4">Saved Holidays</h3>
                <div className="closest-list mt-2">
                  {publicHolidays.map((h) => (
                    <div key={h.id} className="closest-item">
                      <div>
                        <strong>{h.name}</strong>
                        <div className="muted">{h.date}</div>
                      </div>
                      <button className="text-danger" style={{background: 'none', border: 'none', cursor: 'pointer', padding: 0}} onClick={() => removeHoliday(h.id)}>Delete</button>
                    </div>
                  ))}
                  {publicHolidays.length === 0 && <p className="muted">No holidays added yet.</p>}
                </div>
              </div>
            </div>
          )}

{/* DIRECTORY TAB */}
{activeTab === "directory" && (
  <div className="panel full-width">

    <div className="table-header">
      <h2>Staff Directory</h2>

      <div className="filter-group">
        <input
          type="text"
          placeholder="Search employee name"
          value={employeeSearch}
          onChange={(e) => setEmployeeSearch(e.target.value)}
        />

        <select
          value={dirFilter.section}
          onChange={(e) =>
            setDirFilter({ ...dirFilter, section: e.target.value })
          }
        >
          <option value="">All Sections</option>
          {[...new Set(employees.map((e) => e.section).filter(Boolean))].map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            )
          )}
        </select>

        <input
          type="text"
          placeholder="Filter by supervisor..."
          value={dirFilter.supervisor}
          onChange={(e) =>
            setDirFilter({ ...dirFilter, supervisor: e.target.value })
          }
        />
      </div>
    </div>

    <div className="table-container">
      <table className="modern-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Designation</th>
            <th>Section</th>
            <th>Supervisor</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredEmployees.map((e) => (
            <tr key={e.id}>
              <td>{e.name}</td>
              <td>{e.designation || "—"}</td>
              <td>
                <span className="badge">{e.section}</span>
              </td>
              <td>{e.supervisor || "—"}</td>
              <td>
                <button
                  className="text-danger"
                  onClick={() => removeEmployee(e.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {filteredEmployees.length === 0 && (
            <tr>
              <td colSpan="5" className="muted">
                No staff found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

  </div>
)}
{/* IMAAM DIRECTORY TAB */}
{activeTab === "imaam-directory" && (
  <div className="panel full-width">
    {!imaamUnlocked ? (
      <div className="form-stack" style={{ maxWidth: "400px" }}>
        <h2>Imaam Directory Access</h2>

        <input
          type="password"
          placeholder="Enter password"
          value={imaamPassword}
          onChange={(e) => setImaamPassword(e.target.value)}
        />

        <button
          className="primary-btn"
          onClick={() => {
            if (imaamPassword === "Imaam@2026") {
              setImaamUnlocked(true);
              setImaamPassword("");
            } else {
              alert("Incorrect password.");
            }
          }}
        >
          Unlock Imaam Directory
        </button>
      </div>
    ) : (
  <div className="imaam-admin-stack">
        <form className="panel" onSubmit={saveImaam}>
          <h2>Add Imaam</h2>

          <div className="form-stack">
            <input
              type="text"
              placeholder="Imaam name"
              value={imaamForm.name}
              onChange={(e) => setImaamForm({ name: e.target.value })}
            />

            <button type="submit" className="primary-btn" disabled={isLoading}>
              {isLoading ? "Saving..." : "Add Imaam"}
            </button>
          </div>
        </form>
        <form className="panel" onSubmit={saveStatusOption}>
  <h2>Add Hukuru Status Option</h2>

  <div className="form-stack">
    <input
      type="text"
      placeholder="Example: Accepted, Not Accepted, Pending"
      value={statusOptionForm.label}
      onChange={(e) => setStatusOptionForm({ label: e.target.value })}
    />

    <button type="submit" className="primary-btn" disabled={isLoading}>
      {isLoading ? "Saving..." : "Add Status Option"}
    </button>
  </div>
</form>
        <div className="panel">
          <h2>Saved Imaams</h2>

          <div className="closest-list mt-2">
            {imaams.map((imaam) => (
              <div key={imaam.id} className="closest-item">
                <strong>{imaam.name}</strong>

                <button
                  className="text-danger"
                  onClick={() => removeImaam(imaam.id)}
                >
                  Delete
                </button>
              </div>
            ))}

            {imaams.length === 0 && (
              <p className="muted">No Imaams added yet.</p>
            )}
          </div>
        </div>
<div className="panel">
  <h2>Saved Status Options</h2>

  <div className="closest-list mt-2">
    {hukuruStatusOptions.map((option) => (
      <div key={option.id} className="closest-item">
        <strong>{option.label}</strong>

        <button
          className="text-danger"
          onClick={() => removeStatusOption(option.id)}
        >
          Delete
        </button>
      </div>
    ))}

    {hukuruStatusOptions.length === 0 && (
      <p className="muted">No status options added yet.</p>
    )}
  </div>
</div>
<div className="panel full-width">
  <div className="table-header">
    <div>
      <h2>Random Hukuru Selector</h2>
      <p className="muted">
        Generates random Imaam and Badhal Imaam for each mosque, excluding the previous Hukuru assignment for the same mosque.
      </p>
    </div>

    <button
      type="button"
      className="primary-btn-sm"
      onClick={generateRandomHukuruSelection}
    >
      Generate Random Selection
    </button>
  </div>

  <div className="table-container mt-4">
    <table className="modern-table">
      <thead>
        <tr>
          <th>Mosque</th>
          <th>Random Imaam</th>
          <th>Random Badhal Imaam</th>
        </tr>
      </thead>

      <tbody>
        {randomHukuruSelection.map((row) => (
          <tr key={row.mosqueKey}>
            <td><strong>{row.mosque}</strong></td>
            <td><span className="badge">{row.randomImaam}</span></td>
            <td><span className="badge">{row.randomBadhal}</span></td>
          </tr>
        ))}

        {randomHukuruSelection.length === 0 && (
          <tr>
            <td colSpan="3" className="muted text-center">
              No random selection generated yet.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>
      </div>
    )}
  </div>
)}{activeTab === "groups" && (
  <div className="admin-grid">
    <form className="panel" onSubmit={saveGroup}>
      <h2>Create Staff Group</h2>
      <div className="form-stack">
        <input
          type="text"
          placeholder="Group name"
          value={groupForm.name}
          onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
        />

        <div className="checkbox-group group-member-list">
          {employees.map((emp) => (
            <label key={emp.id}>
              <input
                type="checkbox"
                checked={groupForm.members.includes(emp.name)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setGroupForm({
                      ...groupForm,
                      members: [...groupForm.members, emp.name]
                    });
                  } else {
                    setGroupForm({
                      ...groupForm,
                      members: groupForm.members.filter((m) => m !== emp.name)
                    });
                  }
                }}
              />
              {" "}{emp.name} {emp.section ? `(${emp.section})` : ""}
            </label>
          ))}
        </div>

        <button type="submit" className="primary-btn" disabled={isLoading}>
          {isLoading ? "Saving..." : "Create Group"}
        </button>
      </div>
    </form>

    <div className="panel">
      <h2>Saved Staff Groups</h2>
      <div className="closest-list mt-2">
        {staffGroups.map((group) => (
          <div
             key={group.id}
             className="closest-item group-card-clickable"
             style={{ alignItems: "flex-start", cursor: "pointer" }}
             onClick={() => openGroupModal(group)}
>
            <div>
              <strong>{group.name}</strong>
              <div className="muted mt-2">
                {group.members && group.members.length > 0
                  ? group.members.join(", ")
                  : "No members"}
              </div>
            </div>
            <button
              className="text-danger"
              onClick={(e) => {
                e.stopPropagation();
                removeGroup(group.id);
  }}
>
              Delete
            </button>
          </div>
        ))}
        {staffGroups.length === 0 && <p className="muted">No groups created yet.</p>}
      </div>
    </div>
  </div>
)}
{/* STAFF ON LEAVE TAB */}
{activeTab === "staff-on-leave" && (
  <div className="panel full-width random-hukuru-panel">
    <div className="table-header">
      <h2>Staff on Leave</h2>

      <div className="filter-group">
        <input
          type="date"
          value={leaveCheckDate}
          onChange={(e) => setLeaveCheckDate(e.target.value)}
        />

        <button className="refresh-btn" onClick={refreshData}>
          Refresh
        </button>
      </div>
    </div>

    <div className="closest-item">
      <strong>Staff on leave on {leaveCheckDate}</strong>
      <span className="badge">{staffOnLeaveByDate.length}</span>
    </div>

    <div className="table-container mt-4">
      <table className="modern-table">
        <thead>
          <tr>
            <th>Staff</th>
            <th>Leave Start</th>
            <th>Leave End</th>
            <th>Days</th>
          </tr>
        </thead>

        <tbody>
          {staffOnLeaveByDate.map((l) => (
            <tr key={l.id}>
              <td><strong>{l.employee}</strong></td>
              <td>{l.start}</td>
              <td>{l.end}</td>
              <td>{calculateLeaveDays(l.start, l.end)}</td>
            </tr>
          ))}

          {staffOnLeaveByDate.length === 0 && (
            <tr>
              <td colSpan="4" className="muted text-center">
                No staff are on leave on this date.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
   <div className="admin-grid mt-4">
  <section className="panel">
    <h2>Returning Tomorrow</h2>

    {returningTomorrow.length > 0 ? (
      returningTomorrow.map((l) => (
        <div key={l.id} className="closest-item">
          <div>
            <strong>{l.employee}</strong>
            <div className="muted">
              Return to work: {getNextWorkingDay(l.end)}
            </div>
          </div>
        </div>
      ))
    ) : (
      <p className="muted">No staff returning tomorrow.</p>
    )}
  </section>

  <section className="panel">
    <h2>Returning This Week</h2>

    {returningThisWeek.length > 0 ? (
      returningThisWeek.map((l) => (
        <div key={l.id} className="closest-item">
          <div>
            <strong>{l.employee}</strong>
            <div className="muted">
              Return to work: {getNextWorkingDay(l.end)}
            </div>
          </div>
        </div>
      ))
    ) : (
      <p className="muted">No staff returning this week.</p>
    )}
  </section>
</div>
  </div>
)}
{/* LEAVE TREND TAB */}
{activeTab === "leave-trend" && (
  <div className="panel full-width">
<div className="table-header">
  <div>
    <h2>Leave Trend Chart</h2>
    <p className="muted">
      The following trend chart culculates the number of leaves starting each month.
    </p>
  </div>

  <button className="refresh-btn" onClick={refreshData}>
    Refresh
  </button>
</div>

    <div className="trend-chart">
      {leaveTrendData.map((item) => (
        <div key={item.month} className="trend-row">
          <div className="trend-label">{item.month}</div>
          <div className="trend-bar-track">
            <div
              className="trend-bar"
              style={{ width: `${(item.count / maxLeaveCount) * 100}%` }}
            >
              {item.count > 0 ? item.count : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
{/* YAUMIYYA TAB */}
{activeTab === "yaumiyya" && (
  <div className="panel full-width">
    {!yaumiyyaUnlocked ? (
      <div className="form-stack" style={{ maxWidth: "400px" }}>
        <h2>Yaumiyya Access</h2>
        <p className="muted">Enter password to access this section.</p>

        <input
          type="password"
          placeholder="Enter password"
          value={yaumiyyaPassword}
          onChange={(e) => setYaumiyyaPassword(e.target.value)}
        />

        <button
          className="primary-btn"
          onClick={() => {
            if (yaumiyyaPassword === "Yaumiyya@2026") {
              setYaumiyyaUnlocked(true);
              setYaumiyyaPassword("");
            } else {
              alert("Incorrect password.");
            }
          }}
        >
          Unlock Yaumiyya
        </button>
      </div>
    ) : (
      <>
        <div className="table-header">
  <div>
    <h2>Yaumiyya</h2>
    <p className="muted">Daily leave category record.</p>
  </div>

  <div className="filter-group">
    <input
      type="date"
      value={yaumiyyaDate}
      onChange={(e) => setYaumiyyaDate(e.target.value)}
    />

    <button
      className="refresh-btn"
      onClick={() => loadYaumiyya(yaumiyyaDate)}
    >
      Refresh
    </button>
  </div>
</div>

<div className="imaam-admin-stack">
{[
  { key: "annualLeave", title: "Annual Leave" },
  { key: "familyLeave", title: "Family Leave" },
  { key: "sickLeaveMC", title: "Sick Leave (With MC)" },
  { key: "sickLeaveNoMC", title: "Sick Leave (Without MC)" }
].map((category) => (
    <section className="panel" key={category.key}>
      <h2>{category.title}</h2>

      <div className="form-stack">
        <select
          value={yaumiyyaForm[category.key]}
          onChange={(e) =>
            setYaumiyyaForm({
              ...yaumiyyaForm,
              [category.key]: e.target.value
            })
          }
        >
          <option value="">Select staff</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.name}>
              {emp.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="primary-btn"
          onClick={() => addYaumiyyaStaff(category.key)}
        >
          Add Staff
        </button>
      </div>

      <div className="closest-list mt-4">
        {yaumiyyaRecord[category.key].map((staffName) => (
          <div key={staffName} className="closest-item">
            <strong>{staffName}</strong>

            <button
              className="text-danger"
              onClick={() =>
                removeYaumiyyaStaff(category.key, staffName)
              }
            >
              Remove
            </button>
          </div>
        ))}

        {yaumiyyaRecord[category.key].length === 0 && (
          <p className="muted">
            No staff added for this category.
          </p>
        )}
      </div>
    </section>
  ))}
</div>
      </>
    )}
  </div>
)}
{/* HUKURU 2026 TAB */}
{activeTab === "hukuru-2026" && (
<div className="panel full-width">
{!hukuruUnlocked ? (
<div className="form-stack" style={{maxWidth:"400px"}}>
<h2>Hukuru 2026 Access</h2>

<input
type="password"
placeholder="Enter password"
value={hukuruPassword}
onChange={(e)=>setHukuruPassword(e.target.value)}
/>

<button
className="primary-btn"
onClick={()=>{
if(hukuruPassword==="Hukuru@2026"){
setHukuruUnlocked(true);
setHukuruPassword("");
}else{
alert("Incorrect password.");
}
}}
>
Unlock Hukuru 2026
</button>

</div>
) : (
  <div className="panel full-width">
    <div className="table-header">
      <div>
        <h2>Hukuru 2026</h2>
        <p className="muted">Friday Imaam duty records by mosque.</p>
      </div>

      <div className="filter-group">
        <button className="secondary-btn-sm" onClick={goPrevHukuru}>
  ⬅️ Previous Hukuru
</button>

<div className="hukuru-date-picker">
  <button
    type="button"
    className="badge hukuru-date-badge"
    onClick={() => setShowHukuruCalendar(!showHukuruCalendar)}
  >
    {hukuruDate}
  </button>

  {showHukuruCalendar && (
    <div className="hukuru-mini-calendar">
      <div className="hukuru-mini-title">
        {months[new Date(`${hukuruDate}T00:00:00`).getMonth()]}{" "}
        {new Date(`${hukuruDate}T00:00:00`).getFullYear()}
      </div>

      <div className="hukuru-mini-weekdays">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="hukuru-mini-grid">
        {renderHukuruMiniCalendar()}
      </div>
    </div>
  )}
</div>

<button className="secondary-btn-sm" onClick={goNextHukuru}>
  Next Hukuru ➡️
</button>

        <button
          className="refresh-btn"
          onClick={() => {
            refreshData();
            loadHukuru(hukuruDate);
          }}
        >
          Refresh
        </button>

        <button
          className="primary-btn-sm"
          onClick={() => setShowHukuruEditor(!showHukuruEditor)}
        >
          {showHukuruEditor ? "Hide Selection Menu" : "Show Selection Menu"}
        </button>
      </div>
    </div>

    {showHukuruEditor && (
      <>
        <div className="admin-grid">
          {[
            { key: "isthiqaama", title: "Masjidh Isthiqaama" },
            { key: "rilwaan", title: "Masjidh Rilwaan" },
            { key: "vaguthee", title: "Masjidh Vaguthee" }
          ].map((mosque) => (
            <section className="panel" key={mosque.key}>
              <h2>{mosque.title}</h2>

              {[
                { key: "imaam", title: "Imaam" },
                { key: "badhalImaam", title: "Badhal Imaam" }
              ].map((role) => (
                <div key={role.key} className="form-stack mt-4">
                  <h3>{role.title}</h3>

                  <select
                    value={hukuruRecord[mosque.key][role.key].name}
                    onChange={(e) =>
                      updateHukuruField(
                        mosque.key,
                        role.key,
                        "name",
                        e.target.value
                      )
                    }
                  >
                    <option value="">Select Imaam</option>
                    {imaams.map((imaam) => (
                      <option key={imaam.id} value={imaam.name}>
                        {imaam.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={hukuruRecord[mosque.key][role.key].accepted}
                    onChange={(e) =>
                      updateHukuruField(
                        mosque.key,
                        role.key,
                        "accepted",
                        e.target.value
                      )
                    }
                  >
                    <option value="">Select status</option>
                    {hukuruStatusOptions.map((option) => (
                      <option key={option.id} value={option.label}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-4">
          <button className="primary-btn" onClick={handleSaveHukuruRecord}>
            Save Hukuru Record
          </button>
        </div>
      </>
    )}

    <div className="table-container mt-4">
      <table className="modern-table">
        <thead>
          <tr>
            <th>Mosque</th>
            <th>Imaam</th>
            <th>Imaam Status</th>
            <th>Badhal Imaam</th>
            <th>Badhal Status</th>
          </tr>
        </thead>

        <tbody>
          {[
            { key: "isthiqaama", title: "Masjidh Isthiqaama" },
            { key: "rilwaan", title: "Masjidh Rilwaan" },
            { key: "vaguthee", title: "Masjidh Vaguthee" }
          ].map((mosque) => (
            <tr key={mosque.key}>
              <td><strong>{mosque.title}</strong></td>
              <td>{hukuruRecord[mosque.key].imaam.name || "—"}</td>
              <td>
                <span className="badge">
                  {hukuruRecord[mosque.key].imaam.accepted || "—"}
                </span>
              </td>
              <td>{hukuruRecord[mosque.key].badhalImaam.name || "—"}</td>
              <td>
                <span className="badge">
                  {hukuruRecord[mosque.key].badhalImaam.accepted || "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}
</div>
)}
          {/* RECORDS TAB */}
          {activeTab === "records" && (
            <div className="panel full-width">
<div className="table-header">
  <h2>Leave History</h2>

  <div className="filter-group">
    <input
      type="text"
      placeholder="Search employee in leave history"
      value={leaveSearch}
      onChange={(e) => setLeaveSearch(e.target.value)}
    />

    <button
      className="primary-btn-sm"
      onClick={() => closeSidebarAndGo("admin")}
    >
      + Add New Leave
    </button>
  </div>
</div>
              <div className="table-container">
                <table className="modern-table">
                  <thead>
  <tr>
    <th>Staff</th>
    <th>Duration</th>
    <th>Days</th>
    <th>Action</th>
  </tr>
</thead>
                  <tbody>
                    {filteredLeaves.map((l) => (
<tr key={l.id}>
  <td><strong>{l.employee}</strong></td>
  <td>{l.start} — {l.end}</td>
  <td>{calculateLeaveDays(l.start, l.end)}</td>
  <td>
    <div className="action-flex">
      <button
        className="secondary-btn-sm mr-2"
        onClick={() => viewOverlaps(l)}
      >
        Check Overlaps
      </button>
      <button
        className="text-danger"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        onClick={() => removeLeave(l.id)}
      >
        Delete
      </button>
    </div>
  </td>
</tr>
                    ))}
                    {filteredLeaves.length === 0 && (
  <tr>
    <td colSpan="4" className="muted text-center">
      No leave records found.
    </td>
  </tr>
)}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* NEW: OVERLAP MODAL POPUP */}
      {overlapModalData && (
        <div className="modal-overlay" onClick={closeOverlapModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Overlapping Leaves</h3>
              <button className="close-btn" onClick={closeOverlapModal}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Checking conflicts for <strong>{overlapModalData.target.employee}</strong> <br/>
                <span className="muted">({overlapModalData.target.start} to {overlapModalData.target.end})</span>
              </p>

              {overlapModalData.overlaps.length > 0 ? (
                <ul className="overlap-list">
                  {overlapModalData.overlaps.map((o) => (
                    <li key={o.id}>
                      <strong>{o.employee}</strong>
                      <div>{o.start} — {o.end}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="no-overlap mt-4">
                  <span className="badge" style={{background: '#dcfce7', color: '#166534', border: 'none'}}>Clear!</span>
                  <p className="muted mt-2">No other staff have leave during this period.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {groupModalData && (
        <div className="modal-overlay" onClick={closeGroupModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{groupModalData.name}</h3>
              <button className="close-btn" onClick={closeGroupModal}>&times;</button>
            </div>

            <div className="modal-body">
              <p className="muted">Members in this staff group</p>

              {groupModalData.members && groupModalData.members.length > 0 ? (
                <ul className="overlap-list">
{groupModalData.members.map((member, index) => {
  const onLeave = isStaffOnLeaveToday(member);
  const hasUpcomingLeave15Days = leaves.some((l) => {
  const today = new Date();
  const next15 = new Date();
  next15.setDate(today.getDate() + 15);

  const leaveStart = new Date(`${l.start}T00:00:00`);

  return (
    l.employee === member &&
    leaveStart >= today &&
    leaveStart <= next15
  );
});

  return (
    <li
      key={`${groupModalData.id}-${index}`}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px"
      }}
    >
      <strong style={{ color: hasUpcomingLeave15Days ? "#dc2626" : "inherit" }}>
  {member}
</strong>

      <span
        className="badge"
        style={{
          background: onLeave ? "#fee2e2" : "#dcfce7",
          color: onLeave ? "#991b1b" : "#166534",
          border: "none"
        }}
      >
        {onLeave ? "On Leave" : "Present"}
      </span>
    </li>
  );
})}
                </ul>
              ) : (
                <div className="no-overlap mt-4">
                  <p className="muted">No employees in this group.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}export default App;