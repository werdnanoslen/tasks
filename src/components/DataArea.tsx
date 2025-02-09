import classNames from 'classnames';
import React from 'react';
import TextareaAutosize from 'react-textarea-autosize';

interface DataAreaProps {
  id: string;
  handleInput: (
    e: React.FormEvent<HTMLTextAreaElement>,
    index?: number
  ) => void;
  setIsEditing: (isEditing: boolean) => void;
  updateChecklistItem?: (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    index: number
  ) => void;
  index?: number;
  done?: boolean;
  data?: string;
  newTask?: boolean;
  newItemRef?: React.RefObject<HTMLTextAreaElement>;
}
// TODO if just url, show preview and turn into link
function DataArea({
  id,
  handleInput,
  setIsEditing,
  updateChecklistItem,
  index,
  done,
  data,
  newTask,
  newItemRef,
}: DataAreaProps) {
  const inputLabel = newTask ? 'Type to add a task' : 'Edit task';
  const MAXLENGTH = 1000;

  if ((undefined === updateChecklistItem) !== (undefined === index)) {
    console.error(
      'updateChecklistItem and index must all be defined or undefined, id:',
      id
    );
  }
  const isAList = updateChecklistItem && undefined !== index;

  return (
    <TextareaAutosize
      id={`edit-${id}`}
      name="data"
      className={classNames('input', { done: done })}
      value={data}
      onKeyDown={(e) => isAList && updateChecklistItem(e, index)}
      onInput={(e) => handleInput(e, index)}
      onFocus={() => setIsEditing(true)}
      placeholder={inputLabel}
      aria-label={inputLabel}
      rows={1}
      ref={newItemRef}
      autoFocus={newItemRef ? true : false}
      maxLength={MAXLENGTH}
    />
  );
}
export default DataArea;
