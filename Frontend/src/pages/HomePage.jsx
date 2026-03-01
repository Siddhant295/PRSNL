import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import "./HomePage.css";

// ─── Constants ───────────────────────────────────────────────────────
const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

// ─── Date Helpers ────────────────────────────────────────────────────
function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
}

function getWeekDates(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const dt = new Date(monday);
        dt.setDate(monday.getDate() + i);
        dates.push(dt);
    }
    return dates;
}

function isSameDay(a, b) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function formatTime(hour) {
    if (hour === 0) return "12 AM";
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return "12 PM";
    return `${hour - 12} PM`;
}

function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// ─── Task Storage Helpers ────────────────────────────────────────────
function loadTasks() {
    try {
        const raw = JSON.parse(localStorage.getItem("prsnl_tasks") || "{}");
        // Migrate old format (done: bool) → new format (status: string)
        for (const key in raw) {
            if (Array.isArray(raw[key])) {
                raw[key] = raw[key].map(t => {
                    if (typeof t.status === "string") return t;
                    return { text: t.text, status: t.done ? "completed" : "todo" };
                });
            }
        }
        return raw;
    } catch {
        return {};
    }
}

function saveTasks(tasks) {
    localStorage.setItem("prsnl_tasks", JSON.stringify(tasks));
}

// ─── SVG Icons ───────────────────────────────────────────────────────
const ChevronLeft = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
);
const ChevronRight = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
);
const SunIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);
const MoonIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);
const LogOutIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);
const PlusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
const CloseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);
const TrashIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);
const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);
const ProgressIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);
const ClockSmallIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 6v6l4 2" /><circle cx="12" cy="12" r="10" />
    </svg>
);
const ClockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
);

// ─── Time Picker Popup (shadcn Dialog) ─────────────────────────────────
function TimePickerPopup({ onConfirm, onCancel, initialTime }) {
    const parseInit = () => {
        if (initialTime) {
            const parts = initialTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
            if (parts) {
                let h = parseInt(parts[1]);
                const m = parseInt(parts[2]);
                const ampm = parts[3] ? parts[3].toUpperCase() : (h >= 12 ? "PM" : "AM");
                if (!parts[3]) { if (h >= 12) { h = h === 12 ? 12 : h - 12; } if (h === 0) h = 12; }
                return { hour: h, minute: m, ampm };
            }
        }
        return { hour: 9, minute: 0, ampm: "AM" };
    };
    const init = parseInit();
    const [hour, setHour] = useState(init.hour);
    const [minute, setMinute] = useState(init.minute);
    const [ampm, setAmpm] = useState(init.ampm);
    const hourRef = useRef(null);
    const minRef = useRef(null);

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

    // Scroll active items into view on mount
    useEffect(() => {
        setTimeout(() => {
            hourRef.current?.querySelector(".tp-item-active")?.scrollIntoView({ block: "center", behavior: "smooth" });
            minRef.current?.querySelector(".tp-item-active")?.scrollIntoView({ block: "center", behavior: "smooth" });
        }, 100);
    }, []);

    const handleConfirm = () => {
        const hStr = String(hour).padStart(2, "0");
        const mStr = String(minute).padStart(2, "0");
        onConfirm(`${hStr}:${mStr} ${ampm}`);
    };

    return (
        <Dialog open={true} onOpenChange={(open) => { if (!open) onCancel(); }}>
            <DialogContent className="tp-dialog">
                <DialogHeader>
                    <DialogTitle className="tp-dialog-title">
                        <ClockIcon /> Set Time
                    </DialogTitle>
                    <DialogDescription className="tp-dialog-desc">
                        Select hour, minute and period
                    </DialogDescription>
                </DialogHeader>

                {/* Large time preview */}
                <div className="tp-preview">
                    <span className="tp-preview-time">
                        {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}
                    </span>
                    <span className="tp-preview-ampm">{ampm}</span>
                </div>

                {/* Scroll columns */}
                <div className="tp-columns">
                    {/* Hour column */}
                    <div className="tp-col-wrap">
                        <span className="tp-col-label">Hour</span>
                        <div className="tp-scroll-col" ref={hourRef}>
                            {hours.map(h => (
                                <button
                                    key={h}
                                    className={`tp-item ${h === hour ? "tp-item-active" : ""}`}
                                    onClick={() => setHour(h)}
                                >
                                    {String(h).padStart(2, "0")}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="tp-sep">:</div>

                    {/* Minute column */}
                    <div className="tp-col-wrap">
                        <span className="tp-col-label">Min</span>
                        <div className="tp-scroll-col" ref={minRef}>
                            {minutes.map(m => (
                                <button
                                    key={m}
                                    className={`tp-item ${m === minute ? "tp-item-active" : ""}`}
                                    onClick={() => setMinute(m)}
                                >
                                    {String(m).padStart(2, "0")}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* AM / PM */}
                    <div className="tp-col-wrap tp-col-ampm">
                        <span className="tp-col-label">Period</span>
                        <div className="tp-ampm-btns">
                            <Button
                                variant={ampm === "AM" ? "default" : "outline"}
                                size="sm"
                                className="tp-ampm-btn"
                                onClick={() => setAmpm("AM")}
                            >AM</Button>
                            <Button
                                variant={ampm === "PM" ? "default" : "outline"}
                                size="sm"
                                className="tp-ampm-btn"
                                onClick={() => setAmpm("PM")}
                            >PM</Button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="tp-footer">
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={handleConfirm}>
                        <ClockIcon /> Set Time
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Date Task Panel (overlay) ───────────────────────────────────────
function DateTaskPanel({ date, tasks, onClose, onAddTask, onDeleteTask, onSetTaskStatus, onSetTaskTime }) {
    const [newTask, setNewTask] = useState("");
    const [newTaskTime, setNewTaskTime] = useState(null);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [editTimeIndex, setEditTimeIndex] = useState(null);
    const inputRef = useRef(null);
    const panelRef = useRef(null);

    const key = dateKey(date);
    const dateTasks = tasks[key] || [];

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    // Close on Escape
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === "Escape") {
                if (showTimePicker) { setShowTimePicker(false); setEditTimeIndex(null); }
                else onClose();
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose, showTimePicker]);

    const handleAdd = () => {
        const text = newTask.trim();
        if (!text) return;
        onAddTask(key, text, newTaskTime);
        setNewTask("");
        setNewTaskTime(null);
        if (inputRef.current) inputRef.current.focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleAdd();
    };

    const fullDayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const dayNum = date.getDate();
    const monthName = MONTH_NAMES[date.getMonth()];
    const yearNum = date.getFullYear();

    const completedCount = dateTasks.filter(t => t.status === "completed").length;
    const progressCount = dateTasks.filter(t => t.status === "progress").length;

    return (
        <>
            {/* Backdrop */}
            <div className="dtp-backdrop" onClick={onClose} />
            {/* Panel */}
            <div className="dtp-panel" ref={panelRef}>
                {/* Gradient Header */}
                <div className="dtp-header">
                    <div className="dtp-header-content">
                        <div className="dtp-header-top">
                            <span className="dtp-header-badge">{fullDayName}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="dtp-close-btn"
                                onClick={onClose}
                            >
                                <CloseIcon />
                            </Button>
                        </div>
                        <h2 className="dtp-header-date">{dayNum} {monthName}</h2>
                        <p className="dtp-header-year">{yearNum}</p>
                        {dateTasks.length > 0 && (
                            <p className="dtp-header-count">
                                {dateTasks.length} task{dateTasks.length > 1 ? "s" : ""}
                                {completedCount > 0 && ` · ${completedCount} done`}
                                {progressCount > 0 && ` · ${progressCount} in progress`}
                            </p>
                        )}
                    </div>
                </div>

                {/* Task List */}
                <div className="dtp-tasks">
                    {dateTasks.map((task, i) => (
                        <div key={i} className={`dtp-task dtp-task-${task.status}`}>
                            <span className={`dtp-status-indicator dtp-si-${task.status}`} />
                            <span className="dtp-task-text">{task.text}</span>
                            {task.time && <span className="dtp-time-badge"><ClockSmallIcon /> {task.time}</span>}
                            <div className="dtp-actions">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`dtp-action-btn dtp-act-complete ${task.status === "completed" ? "dtp-act-active" : ""}`}
                                    onClick={() => onSetTaskStatus(key, i, task.status === "completed" ? "todo" : "completed")}
                                    title="Mark completed"
                                >
                                    <CheckIcon />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`dtp-action-btn dtp-act-progress ${task.status === "progress" ? "dtp-act-active" : ""}`}
                                    onClick={() => onSetTaskStatus(key, i, task.status === "progress" ? "todo" : "progress")}
                                    title="In progress"
                                >
                                    <ProgressIcon />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="dtp-action-btn dtp-act-delete"
                                    onClick={() => onDeleteTask(key, i)}
                                    title="Delete task"
                                >
                                    <TrashIcon />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Task Input */}
                <div className="dtp-add">
                    <Input
                        ref={inputRef}
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="What needs to be done?"
                        className="dtp-input"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`dtp-clock-toggle ${newTaskTime ? "dtp-clock-active" : ""}`}
                        onClick={() => { setEditTimeIndex(null); setShowTimePicker(true); }}
                        title={newTaskTime ? `Time: ${newTaskTime}` : "Set time"}
                    >
                        <ClockIcon />
                        {newTaskTime && <span className="dtp-clock-dot" />}
                    </Button>
                    <Button onClick={handleAdd} disabled={!newTask.trim()} className="dtp-add-btn">
                        <PlusIcon /> Add Task
                    </Button>
                </div>

                {/* Time Picker for new task or editing existing */}
                {showTimePicker && (
                    <TimePickerPopup
                        initialTime={editTimeIndex !== null ? dateTasks[editTimeIndex]?.time : newTaskTime}
                        onCancel={() => { setShowTimePicker(false); setEditTimeIndex(null); }}
                        onConfirm={(time) => {
                            if (editTimeIndex !== null) {
                                onSetTaskTime(key, editTimeIndex, time);
                            } else {
                                setNewTaskTime(time);
                            }
                            setShowTimePicker(false);
                            setEditTimeIndex(null);
                        }}
                    />
                )}
            </div>
        </>
    );
}

// ─── Monthly View ────────────────────────────────────────────────────
function MonthlyView({ year, month, today, selectedDate, onSelectDate, tasks }) {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const cells = useMemo(() => {
        const arr = [];
        for (let i = 0; i < firstDay; i++) arr.push(null);
        for (let d = 1; d <= daysInMonth; d++) arr.push(d);
        return arr;
    }, [daysInMonth, firstDay]);

    return (
        <div className="hp-monthly">
            <div className="hp-month-grid hp-day-headers">
                {DAYS_OF_WEEK.map((d) => (
                    <div key={d} className="hp-day-header">{d}</div>
                ))}
            </div>
            <div className="hp-month-grid hp-day-cells">
                {cells.map((day, i) => {
                    if (day === null) return <div key={`e-${i}`} className="hp-day-cell hp-empty" />;
                    const date = new Date(year, month, day);
                    const isToday = isSameDay(date, today);
                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                    const isPast = date < today && !isToday;
                    const dk = dateKey(date);
                    const taskCount = (tasks[dk] || []).length;

                    return (
                        <button
                            key={day}
                            className={`hp-day-cell ${isToday ? "hp-today" : ""} ${isSelected ? "hp-selected" : ""} ${isPast ? "hp-past" : ""}`}
                            onClick={() => onSelectDate(date)}
                        >
                            <span className="hp-day-num">{day}</span>
                            {taskCount > 0 && (
                                <span className="hp-task-dots">
                                    {Array.from({ length: Math.min(taskCount, 3) }).map((_, j) => (
                                        <span key={j} className="hp-task-dot" />
                                    ))}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Weekly View ─────────────────────────────────────────────────────
function WeeklyView({ today, selectedDate, onSelectDate, currentDate, tasks, onSetTaskStatus, onDeleteTask, onSetTaskTime }) {
    const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

    return (
        <div className="hp-weekly">
            <div className="hp-week-cols">
                {weekDates.map((date, i) => {
                    const isToday = isSameDay(date, today);
                    const dk = dateKey(date);
                    const dayTasks = tasks[dk] || [];

                    return (
                        <div key={i} className={`hp-week-col ${isToday ? "hp-week-col-today" : ""}`}>
                            <button
                                className={`hp-week-day-h ${isToday ? "hp-today" : ""}`}
                                onClick={() => onSelectDate(date)}
                            >
                                <span className="hp-wdn">{DAYS_OF_WEEK[i]}</span>
                                <span className={`hp-wdd ${isToday ? "hp-today-num" : ""}`}>{date.getDate()}</span>
                            </button>
                            <div className="hp-week-tasks">
                                {dayTasks.map((task, j) => (
                                    <div key={j} className={`hp-wt-item hp-wt-${task.status}`}>
                                        <span className={`hp-wt-dot hp-wt-dot-${task.status}`} />
                                        <span className="hp-wt-text">{task.text}</span>
                                        {task.time && <span className="hp-wt-time">{task.time}</span>}
                                        {!task.time && (
                                            <button
                                                className="hp-wt-clock-btn"
                                                onClick={(e) => { e.stopPropagation(); onSetTaskTime(dk, j); }}
                                                title="Set time"
                                            >
                                                <ClockSmallIcon />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Today View ──────────────────────────────────────────────────────
function TodayView({ today, tasks, onAddTask, onSetTaskStatus, onDeleteTask, onSetTaskTime }) {
    const dk = dateKey(today);
    const dateTasks = tasks[dk] || [];
    const [newTask, setNewTask] = useState("");
    const [newTaskTime, setNewTaskTime] = useState(null);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [editTimeIndex, setEditTimeIndex] = useState(null);

    const handleAdd = () => {
        const text = newTask.trim();
        if (!text) return;
        onAddTask(dk, text, newTaskTime);
        setNewTask("");
        setNewTaskTime(null);
    };

    const completedCount = dateTasks.filter(t => t.status === "completed").length;
    const progressCount = dateTasks.filter(t => t.status === "progress").length;

    return (
        <div className="hp-today-view">
            {/* Header banner */}
            <div className="hp-today-banner">
                <div className="hp-today-banner-left">
                    <div className="hp-today-dot" />
                    <div>
                        <div className="hp-today-day">{today.toLocaleDateString("en-US", { weekday: "long" })}</div>
                        <div className="hp-today-date">
                            {today.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                            {dateTasks.length > 0 && (
                                <span className="hp-today-stats">
                                    {" · "}{dateTasks.length} task{dateTasks.length > 1 ? "s" : ""}
                                    {completedCount > 0 && `, ${completedCount} done`}
                                    {progressCount > 0 && `, ${progressCount} active`}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add task inline */}
            <div className="hp-today-add-bar">
                <Input
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    placeholder="Add a new task for today..."
                    className="hp-today-add-input"
                />
                <Button
                    variant="ghost"
                    size="icon"
                    className={`hp-tv-add-clock ${newTaskTime ? "hp-tv-add-clock-active" : ""}`}
                    onClick={() => { setEditTimeIndex(null); setShowTimePicker(true); }}
                    title={newTaskTime ? `Time: ${newTaskTime}` : "Set time"}
                >
                    <ClockIcon />
                    {newTaskTime && <span className="dtp-clock-dot" />}
                </Button>
                <Button onClick={handleAdd} disabled={!newTask.trim()} className="hp-today-add-btn">
                    <PlusIcon /> Add Task
                </Button>
            </div>

            {/* Task list */}
            <div className="hp-today-task-list">
                {dateTasks.map((task, i) => (
                    <div key={i} className={`hp-tv-task hp-tv-${task.status}`}>
                        <span className={`hp-tv-dot hp-tv-dot-${task.status}`} />
                        <span className="hp-tv-text">{task.text}</span>
                        {task.time && (
                            <span className="hp-tv-time"><ClockSmallIcon /> {task.time}</span>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hp-tv-clock-btn"
                            onClick={() => { setEditTimeIndex(i); setShowTimePicker(true); }}
                            title={task.time ? `Time: ${task.time}` : "Set time"}
                        >
                            <ClockSmallIcon />
                        </Button>
                        <div className="hp-tv-actions">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`hp-tv-act hp-tv-act-check ${task.status === "completed" ? "hp-tv-act-active-green" : ""}`}
                                onClick={() => onSetTaskStatus(dk, i, task.status === "completed" ? "todo" : "completed")}
                                title="Complete"
                            >
                                <CheckIcon />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`hp-tv-act hp-tv-act-prog ${task.status === "progress" ? "hp-tv-act-active-amber" : ""}`}
                                onClick={() => onSetTaskStatus(dk, i, task.status === "progress" ? "todo" : "progress")}
                                title="In progress"
                            >
                                <ProgressIcon />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hp-tv-act hp-tv-act-del"
                                onClick={() => onDeleteTask(dk, i)}
                                title="Delete"
                            >
                                <TrashIcon />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Time Picker Popup */}
            {showTimePicker && (
                <TimePickerPopup
                    initialTime={editTimeIndex !== null ? dateTasks[editTimeIndex]?.time : newTaskTime}
                    onCancel={() => { setShowTimePicker(false); setEditTimeIndex(null); }}
                    onConfirm={(time) => {
                        if (editTimeIndex !== null) {
                            onSetTaskTime(dk, editTimeIndex, time);
                        } else {
                            setNewTaskTime(time);
                        }
                        setShowTimePicker(false);
                        setEditTimeIndex(null);
                    }}
                />
            )}
        </div>
    );
}

// ─── Main Home Page ──────────────────────────────────────────────────
export default function HomePage() {
    const navigate = useNavigate();
    const today = new Date();

    const [activeView, setActiveView] = useState("monthly");
    const [currentDate, setCurrentDate] = useState(today);
    const [selectedDate, setSelectedDate] = useState(null);
    const [panelDate, setPanelDate] = useState(null); // date for the task panel
    const [tasks, setTasks] = useState(loadTasks);
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("theme") === "dark";
        }
        return false;
    });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    // Apply dark mode class to <html>
    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            root.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [isDark]);

    // Persist tasks
    useEffect(() => {
        saveTasks(tasks);
    }, [tasks]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const navigatePrev = () => {
        const d = new Date(currentDate);
        if (activeView === "monthly") d.setMonth(d.getMonth() - 1);
        else if (activeView === "weekly") d.setDate(d.getDate() - 7);
        else d.setDate(d.getDate() - 1);
        setCurrentDate(d);
    };

    const navigateNext = () => {
        const d = new Date(currentDate);
        if (activeView === "monthly") d.setMonth(d.getMonth() + 1);
        else if (activeView === "weekly") d.setDate(d.getDate() + 7);
        else d.setDate(d.getDate() + 1);
        setCurrentDate(d);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(new Date());
    };

    // Task CRUD
    const addTask = (key, text, time) => {
        const task = { text, status: "todo" };
        if (time) task.time = time;
        setTasks((prev) => ({
            ...prev,
            [key]: [...(prev[key] || []), task],
        }));
    };

    const deleteTask = (key, index) => {
        setTasks((prev) => {
            const arr = [...(prev[key] || [])];
            arr.splice(index, 1);
            return { ...prev, [key]: arr };
        });
    };

    const setTaskStatus = (key, index, status) => {
        setTasks((prev) => {
            const arr = [...(prev[key] || [])];
            arr[index] = { ...arr[index], status };
            return { ...prev, [key]: arr };
        });
    };

    const setTaskTime = (key, index, time) => {
        setTasks((prev) => {
            const arr = [...(prev[key] || [])];
            arr[index] = { ...arr[index], time };
            return { ...prev, [key]: arr };
        });
    };

    // When a date is clicked in monthly view, open the panel
    const handleDateClick = (date) => {
        setSelectedDate(date);
        setPanelDate(date);
    };

    const getTitle = () => {
        if (activeView === "monthly") return `${MONTH_NAMES[month]} ${year}`;
        if (activeView === "weekly") {
            const wd = getWeekDates(currentDate);
            const s = wd[0], e = wd[6];
            if (s.getMonth() === e.getMonth())
                return `${s.getDate()} – ${e.getDate()} ${MONTH_NAMES[s.getMonth()]} ${s.getFullYear()}`;
            return `${s.getDate()} ${MONTH_NAMES[s.getMonth()].slice(0, 3)} – ${e.getDate()} ${MONTH_NAMES[e.getMonth()].slice(0, 3)} ${e.getFullYear()}`;
        }
        return currentDate.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    };

    return (
        <div className="hp-root">
            {/* ── Top Bar ── */}
            <header className="hp-topbar">
                <div className="hp-topbar-l">
                    <span className="hp-logo">📅 PRSNL</span>
                </div>
                <div className="hp-topbar-r">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsDark(!isDark)}
                        className="hp-theme-btn"
                        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                    >
                        {isDark ? <SunIcon /> : <MoonIcon />}
                    </Button>
                    <div className="hp-user-badge">
                        <div className="hp-avatar">{user.firstName?.[0] || user.email?.[0] || "U"}</div>
                        <span className="hp-username">{user.firstName || user.email || "User"}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign out" className="hp-logout-btn">
                        <LogOutIcon />
                    </Button>
                </div>
            </header>

            {/* ── Toolbar ── */}
            <div className="hp-toolbar">
                <div className="hp-tabs">
                    {["monthly", "weekly", "today"].map((tab) => (
                        <button
                            key={tab}
                            className={`hp-tab ${activeView === tab ? "hp-tab-active" : ""}`}
                            onClick={() => {
                                setActiveView(tab);
                                setPanelDate(null);
                                if (tab === "today") setCurrentDate(new Date());
                            }}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="hp-nav">
                    <button className="hp-nav-btn" onClick={navigatePrev}><ChevronLeft /></button>
                    <h2 className="hp-title">{getTitle()}</h2>
                    <button className="hp-nav-btn" onClick={navigateNext}><ChevronRight /></button>
                </div>
                <Button variant="outline" size="sm" onClick={goToToday} className="hp-today-btn">Today</Button>
            </div>

            {/* ── Calendar Card with relative positioning for overlay ── */}
            <Card className="hp-card">
                {activeView === "monthly" && (
                    <MonthlyView year={year} month={month} today={today} selectedDate={selectedDate} onSelectDate={handleDateClick} tasks={tasks} />
                )}
                {activeView === "weekly" && (
                    <WeeklyView today={today} selectedDate={selectedDate} onSelectDate={setSelectedDate} currentDate={currentDate} tasks={tasks} onSetTaskStatus={setTaskStatus} onDeleteTask={deleteTask} onSetTaskTime={setTaskTime} />
                )}
                {activeView === "today" && (
                    <TodayView today={currentDate} tasks={tasks} onAddTask={addTask} onSetTaskStatus={setTaskStatus} onDeleteTask={deleteTask} onSetTaskTime={setTaskTime} />
                )}

                {/* Date Task Panel Overlay */}
                {panelDate && (
                    <DateTaskPanel
                        date={panelDate}
                        tasks={tasks}
                        onClose={() => setPanelDate(null)}
                        onAddTask={addTask}
                        onDeleteTask={deleteTask}
                        onSetTaskStatus={setTaskStatus}
                        onSetTaskTime={setTaskTime}
                    />
                )}
            </Card>
        </div>
    );
}
