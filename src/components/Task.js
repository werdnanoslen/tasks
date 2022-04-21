import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from 'react-markdown'
import ReactDom from 'react-dom'
import remarkGfm from 'remark-gfm'
import { ReactComponent as Check } from '../images/check.svg'
import { ReactComponent as Rubbish} from '../images/rubbish.svg'

export default function Task(props) {
  const [isEditing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');

  const editFieldRef = useRef(null);
  const editButtonRef = useRef(null);

  const completeLabel = props.completed ? 'Restore' : 'Complete';

  function handleChange(e) {
    setNewName(e.target.value);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!newName.trim()) {
      return;
    }
    props.editTask(props.id, newName);
    setNewName("");
    setEditing(false);
  }

  function blurCancel(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setEditing(false);
    }
  }

  function handleEdit(e) {
    setEditing(true);
    console.log(editFieldRef)
    setTimeout(() => {editFieldRef.current.focus()}, 1); //omg why
  }

  const editingTemplate = (
    <form className="task-edit" onSubmit={handleSubmit} onBlur={blurCancel}>
      <label className="visually-hidden" htmlFor={props.id}>
        New name for {props.name}
      </label>
      <textarea
        id={props.id}
        className="input"
        value={newName || props.name}
        onChange={handleChange}
        ref={editFieldRef}
      />
      <div className="btn-group">
        <button type="button" className="btn visually-hidden" onClick={() => setEditing(false)}>
          Cancel renaming {props.name}
        </button>
        <button type="submit" className="btn">
          Save
          <span className="visually-hidden">new name for {props.name}</span>
        </button>
      </div>
    </form>
  );

  const viewTemplate = (
    <div className="task-view" onClick={handleEdit}>
      <ReactMarkdown
        className="task-label"
        htmlFor={props.id}
        children={props.name}
        remarkPlugins={[remarkGfm]}
      />
      <div className="btn-group">
        <button
          type="button"
          className="btn btn__icon"
          onClick={() => props.toggleTaskCompleted(props.id)}
        >
          <Check aria-hidden="true"/>
          <span className="visually-hidden">{completeLabel} {props.name}</span>
        </button>
        <button
          type="button"
          className="btn btn__icon"
          onClick={() => props.deleteTask(props.id)}
        >
          <Rubbish aria-hidden="true"/>
          <span className="visually-hidden">Delete {props.name}</span>
        </button>
      </div>
    </div>
  );

  return <li className="task">{isEditing ? editingTemplate : viewTemplate}</li>;
}
