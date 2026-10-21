import { useCallback, useEffect, useState } from 'react';
import { createTask, deleteTask, getTasks, updateTask } from '../api/tasks';
import './TaskManager.css';

const emptyForm = { title: '', description: '', priority: 'medium' };

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refreshTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setTasks(await getTasks()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function initLoad() {
      try {
        const data = await getTasks();
        if (!ignore) setTasks(data);
      } catch (e) {
        if (!ignore) setError(e.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    initLoad();
    return () => { ignore = true; };
  }, []);

  function changeField(event) {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError(''); setNotice(''); setSaving(true);
    try {
      if (editingId) {
        await updateTask(editingId, form);
        setNotice('Task updated.');
      } else {
        await createTask(form);
        setNotice('Task created.');
      }
      setForm(emptyForm); setEditingId(null);
      await refreshTasks();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  function startEdit(task) {
    setEditingId(task._id);
    setForm({ title: task.title || '', description: task.description || '', priority: task.priority || 'medium' });
    setError(''); setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function toggleCompleted(task) {
    setBusyId(task._id); setError(''); setNotice('');
    try {
      await updateTask(task._id, { title: task.title, description: task.description || '', priority: task.priority || 'medium', completed: !task.completed });
      setNotice(task.completed ? 'Task marked incomplete.' : 'Task marked complete.');
      await refreshTasks();
    } catch (e) { setError(e.message); }
    finally { setBusyId(null); }
  }

  async function removeTask(task) {
    if (!window.confirm(`Delete “${task.title}”?`)) return;
    setBusyId(task._id); setError(''); setNotice('');
    try {
      await deleteTask(task._id);
      setNotice('Task deleted.');
      await refreshTasks();
    } catch (e) { setError(e.message); }
    finally { setBusyId(null); }
  }

  return <main className="task-manager">
    <section className="task-hero">
      <p className="task-eyebrow">AWDF · PRACTICAL 6</p>
      <h1>Task <span>Manager</span></h1>
      <p>Full-stack CRUD powered by React, Express, and MongoDB.</p>
      <div className="task-count">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} stored in your database</div>
    </section>

    <section className="task-panel">
      <h2>{editingId ? 'Edit task' : 'Create a task'}</h2>
      <form onSubmit={submit} className="task-form">
        <label>Title<input name="title" value={form.title} onChange={changeField} maxLength={120} required placeholder="e.g. Finish practical report" /></label>
        <label>Description<textarea name="description" value={form.description} onChange={changeField} rows={3} maxLength={1000} placeholder="Optional details" /></label>
        <label>Priority<select name="priority" value={form.priority} onChange={changeField}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
        <div className="task-form-actions"><button className="task-primary" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add task'}</button>{editingId && <button type="button" className="task-secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>}</div>
      </form>
    </section>

    <section className="task-list-section">
      <div className="task-list-heading"><h2>Your tasks</h2><button className="task-secondary" onClick={refreshTasks} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh list'}</button></div>
      {error && <div className="task-alert task-error" role="alert">{error}</div>}
      {notice && !error && <div className="task-alert task-success" role="status">{notice}</div>}
      {loading ? <p className="task-empty">Loading tasks from the API…</p> : tasks.length === 0 ? <p className="task-empty">No tasks yet. Create one using the form above.</p> : <div className="task-cards">{tasks.map(task => <article className={`task-card ${task.completed ? 'is-complete' : ''}`} key={task._id}>
        <div className="task-card-top"><span className={`task-priority priority-${task.priority || 'medium'}`}>{task.priority || 'medium'} priority</span><span className="task-status">{task.completed ? 'Completed' : 'Open'}</span></div>
        <h3>{task.title}</h3>{task.description && <p className="task-description">{task.description}</p>}
        <p className="task-date">Created {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'date unavailable'}</p>
        <div className="task-card-actions"><button className="task-secondary" disabled={busyId === task._id} onClick={() => toggleCompleted(task)}>{busyId === task._id ? 'Working…' : task.completed ? 'Mark open' : 'Complete'}</button><button className="task-secondary" disabled={busyId === task._id} onClick={() => startEdit(task)}>Edit</button><button className="task-danger" disabled={busyId === task._id} onClick={() => removeTask(task)}>Delete</button></div>
      </article>)}</div>}
    </section>
  </main>;
}
