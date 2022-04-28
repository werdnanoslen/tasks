import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from 'react-markdown'
import ReactDom from 'react-dom'
import remarkGfm from 'remark-gfm'
import { ReactComponent as Check } from '../images/check.svg'
import { ReactComponent as Rubbish} from '../images/rubbish.svg'

export default function Task(props) {
  const [isEditing, setEditing] = useState(false);
  const [text, setText] = useState('');

  const editFieldRef = useRef(null);
  const editButtonRef = useRef(null);

  const completeLabel = props.done ? 'Restore' : 'Complete';

  function handleChange(e) {
    setText(e.target.value);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) {
      return;
    }
    props.editTask(props.id, text);
    setText("");
    setEditing(false);
  }

  function blurCancel(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setEditing(false);
    }
  }

  function handleEdit(e) {
    setEditing(true);
    setTimeout(() => {editFieldRef.current.focus()}, 1); //omg why
  }

  const editingTemplate = (
    <form onSubmit={handleSubmit} onBlur={blurCancel}>
      <label htmlFor={props.id} className="visually-hidden">
        Edit <span className="visually-hidden">{props.text}</span>
      </label>
      <textarea
        id={props.id}
        name="text"
        className="input"
        value={text || props.text}
        onChange={handleChange}
        ref={editFieldRef}
      />
      <div className="btn-group">
        <button type="submit" className="btn">
          Save <span className="visually-hidden">{props.text}</span>
        </button>
        <button type="button" className="btn" onClick={() => setEditing(false)}>
          Cancel <span className="visually-hidden">{props.text}</span>
        </button>
      </div>
    </form>
  );

  const viewTemplate = (
    <div className="task-view" onClick={handleEdit}>
      <ReactMarkdown
        className="task-label"
        htmlFor={props.id}
        children={props.text}
        remarkPlugins={[remarkGfm]}
      />
      <div className="btn-group">
        <button
          type="button"
          className="btn btn__icon"
          onClick={() => props.toggleTaskDone(props.id)}
        >
          <Check aria-hidden="true"/>
          <span className="visually-hidden">{completeLabel} {props.text}</span>
        </button>
        <button
          type="button"
          className="btn btn__icon"
          onClick={() => props.deleteTask(props.id)}
        >
          <Rubbish aria-hidden="true"/>
          <span className="visually-hidden">Delete {props.text}</span>
        </button>
      </div>
    </div>
  );

  return <li className="task" id={`li-${props.id}`}>{isEditing ? editingTemplate : viewTemplate}</li>;
}
