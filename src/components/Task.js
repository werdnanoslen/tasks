import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import ReactDom from 'react-dom'
import remarkGfm from 'remark-gfm'
import { ReactComponent as Check } from '../images/check.svg'
import { ReactComponent as Rubbish } from '../images/rubbish.svg'

export default function Task(props) {
  const [isEditing, setEditing] = useState(false)
  const [data, setData] = useState({})

  const editFieldRef = useRef(null)
  const editButtonRef = useRef(null)

  const completeLabel = props.done ? 'Restore' : 'Complete'

  function handleChange(e) {
    setData(e.target.value)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!data.trim()) {
      return
    }
    props.editTask(props.id, data)
    setData({})
    setEditing(false)
  }

  function blurCancel(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      props.editTask(props.id, data)
      setEditing(false)
    }
  }

  function handleEdit(e) {
    setEditing(true)
    setTimeout(() => {
      editFieldRef.current.focus()
    }, 1) //omg why
  }

  const editingTemplate = (
    <form onSubmit={handleSubmit} onBlur={blurCancel}>
      <label htmlFor={props.id} className="visually-hidden">
        Edit <span className="visually-hidden">{props.data}</span>
      </label>
      <textarea
        id={props.id}
        name="data"
        className="input"
        value={typeof(data) === 'string' ? data : props.data}
        onChange={handleChange}
        ref={editFieldRef}
      />
      <div className="btn-group">
        <button type="submit" className="btn">
          Save <span className="visually-hidden">{props.data}</span>
        </button>
        <button type="button" className="btn" onClick={() => setEditing(false)}>
          Cancel <span className="visually-hidden">{props.data}</span>
        </button>
      </div>
    </form>
  )

  const textViewTemplate = (
    <ReactMarkdown
      className="task-label"
      htmlFor={props.id}
      children={''+props.data}
      remarkPlugins={[remarkGfm]}
    />
  )

  function listViewTemplate() {
    return (
      <>
        {props.data.map((item, index) => (
          <ReactMarkdown
            className="task-label"
            htmlFor={item.id}
            children={''+item.data}
            remarkPlugins={[remarkGfm]}
          />
        ))}
      </>
    )
  }

  const viewTemplate = (
    <div className="task-view" onClick={handleEdit}>
      {typeof props.data === 'string' ? textViewTemplate : listViewTemplate() }
      <div className="btn-group">
        <button
          type="button"
          className="btn btn__icon"
          onClick={() => props.toggleTaskDone(props.id)}
        >
          <Check aria-hidden="true" />
          <span className="visually-hidden">
            {completeLabel} {props.id}
          </span>
        </button>
        <button
          type="button"
          className="btn btn__icon"
          onClick={() => props.deleteTask(props.id)}
        >
          <Rubbish aria-hidden="true" />
          <span className="visually-hidden">Delete {props.id}</span>
        </button>
      </div>
    </div>
  )

  return (
    <li className="task" id={`li-${props.id}`}>
      {isEditing ? editingTemplate : viewTemplate}
    </li>
  )
}
