import { useState, useEffect } from "react";
import "./App.css";

interface Student {
  id: number;
  name: string;
}

interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: "present" | "absent";
}

type AttendanceData = Record<number, AttendanceRecord[]>; // studentId -> records

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceData>({});
  const [newStudentName, setNewStudentName] = useState("");
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Load from localStorage on mount
  useEffect(() => {
    const storedStudents = localStorage.getItem("students");
    const storedAttendance = localStorage.getItem("attendance");
    if (storedStudents) setStudents(JSON.parse(storedStudents));
    if (storedAttendance) setAttendance(JSON.parse(storedAttendance));
  }, []);

  // Save students to localStorage
  useEffect(() => {
    localStorage.setItem("students", JSON.stringify(students));
  }, [students]);

  // Save attendance to localStorage
  useEffect(() => {
    localStorage.setItem("attendance", JSON.stringify(attendance));
  }, [attendance]);

  // Add a new student
  const addStudent = () => {
    const trimmedName = newStudentName.trim();
    if (!trimmedName) return;
    const newStudent: Student = {
      id: Date.now(),
      name: trimmedName,
    };
    setStudents([...students, newStudent]);
    setNewStudentName("");
  };

  // Toggle today's attendance status for a student
  const toggleAttendance = (studentId: number) => {
    setAttendance((prev) => {
      const records = prev[studentId] || [];
      const todayIndex = records.findIndex((r) => r.date === today);

      if (todayIndex >= 0) {
        const currentStatus = records[todayIndex].status;
        const newStatus = currentStatus === "present" ? "absent" : "present";
        const updatedRecords = [...records];
        updatedRecords[todayIndex] = { date: today, status: newStatus };
        return { ...prev, [studentId]: updatedRecords };
      } else {
        return {
          ...prev,
          [studentId]: [...records, { date: today, status: "present" }],
        };
      }
    });
  };

  // Get attendance status for today
  const getTodayStatus = (studentId: number) => {
    const records = attendance[studentId] || [];
    const todayRecord = records.find((r) => r.date === today);
    return todayRecord ? todayRecord.status : "absent";
  };

  // Calculate attendance percentage
  const getAttendancePercentage = (studentId: number) => {
    const records = attendance[studentId] || [];
    if (records.length === 0) return 0;
    const presentDays = records.filter((r) => r.status === "present").length;
    return Math.round((presentDays / records.length) * 100);
  };

  // Export attendance data as CSV
  const exportCSV = () => {
    const header = ["Student Name", "Date", "Status"];
    const rows = students.flatMap((student) => {
      const records = attendance[student.id] || [];
      if (records.length === 0) {
        return [[student.name, "", "No records"]];
      }
      return records.map((r) => [student.name, r.date, r.status]);
    });

    const csvContent =
      [header, ...rows]
        .map((e) => e.join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "attendance.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle CSV file upload for student list
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // Each line is a student name
      const names = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      const newStudents = names.map((name) => ({
        id: Date.now() + Math.random(),
        name,
      }));

      setStudents((prev) => {
        const existingNames = new Set(prev.map((s) => s.name.toLowerCase()));
        const filteredNew = newStudents.filter(
          (s) => !existingNames.has(s.name.toLowerCase())
        );
        return [...prev, ...filteredNew];
      });
    };
    reader.readAsText(file);
    e.target.value = ""; // reset file input so same file can be uploaded again if needed
  };

  return (
    <div className="container">
      <h1>Class Attendance Manager</h1>

      <div className="input-group">
        <input
          type="text"
          placeholder="New student name"
          value={newStudentName}
          onChange={(e) => setNewStudentName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addStudent();
          }}
        />
        <button onClick={addStudent}>Add Student</button>
      </div>

      {/* CSV Upload */}
      <div className="input-group" style={{ marginTop: "1rem" }}>
        <label
          htmlFor="uploadCsv"
          style={{ cursor: "pointer", color: "#007bff", textDecoration: "underline" }}
        >
          Upload Student List (CSV)
        </label>
        <input
          id="uploadCsv"
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
      </div>

      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Today ({today})</th>
            <th>Attendance %</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 && (
            <tr>
              <td colSpan={3} className="no-students">
                No students added yet.
              </td>
            </tr>
          )}

          {students.map((student) => {
            const todayStatus = getTodayStatus(student.id);
            const attendancePercent = getAttendancePercentage(student.id);
            return (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td
                  className={`attendance ${todayStatus}`}
                  onClick={() => toggleAttendance(student.id)}
                  title="Click to toggle attendance"
                >
                  {todayStatus === "present" ? "Present" : "Absent"}
                </td>
                <td className="percentage">{attendancePercent}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button onClick={exportCSV}>Export as CSV</button>
      <button onClick={() => {
  if (confirm("Are you sure you want to reset all data?")) {
    localStorage.clear();
    location.reload(); // force refresh
  }
}}>
  Reset All Data
</button>

    </div>
    
  );
}
