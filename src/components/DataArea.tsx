import classNames from "classnames";
import React from "react";
import TextareaAutosize from 'react-textarea-autosize';
import { ListItem } from "../tasks/task.model";

interface DataAreaProps {
  addChecklistItem: (e: React.KeyboardEvent<HTMLTextAreaElement>, index: number) => void;
  handleInput: (e: React.FormEvent<HTMLTextAreaElement>, index?: number) => void;
  setIsEditing: (isEditing: boolean) => void;
  item?: ListItem;
  index?: number;
  done?: boolean;
  data?: string;
  newTask?: boolean;
  newItemId?: string;
  lastRef?: React.RefObject<HTMLTextAreaElement>;
}
// TODO if just url, show preview and turn into link
function DataArea({
  addChecklistItem,
  handleInput,
  setIsEditing,
  item,
  index,
  done,
  data,
  newTask,
  newItemId,
  lastRef
}: DataAreaProps) {
  const inputLabel = newTask ? 'Type to add a task' : 'Edit task';
  const MAXLENGTH = 1000;

  return (
    <TextareaAutosize
      id={`edit-${item ? item.id : index}`}
      name="data"
      className={classNames('input', { done: done })}
      value={item ? item.data : data}
      onKeyDown={(e) => index && addChecklistItem(e, index)}
      onInput={(e) => index ? handleInput(e, index) : handleInput(e)}
      onFocus={() => setIsEditing(true)}
      placeholder={inputLabel}
      aria-label={inputLabel}
      rows={1}
      ref={item && item.id === newItemId ? lastRef : undefined}
      maxLength={MAXLENGTH}
    />
  );
}
export default DataArea;