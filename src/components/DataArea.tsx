import React, { FC, useEffect, useRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

interface DataAreaProps {
  data?: string;
  id?: string;
  handleInput: (e, id: string) => void;
  addChecklistItem?: (e: React.KeyboardEvent, id: string) => void;
}

// TODO if just url, show preview and turn into link
const DataArea: FC<DataAreaProps> = ({
  data = '',
  id = crypto.randomUUID(),
  handleInput,
  addChecklistItem,
}) => {
  const MAXLENGTH = 1000;
  const inputLabel = id === 'new-task' ? 'Type to add a task' : 'Edit task';
  const lastRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (lastRef.current) lastRef.current.focus();
  }, [lastRef]);

  return (
    <TextareaAutosize
      id={`edit-${id}`}
      name="data"
      className="input"
      value={data}
      onKeyDown={(e) => addChecklistItem && addChecklistItem(e, id)}
      onInput={(e) => handleInput(e, id)}
      placeholder={inputLabel}
      aria-label={inputLabel}
      rows={1}
      ref={id === 'new-task' ? lastRef : undefined}
      maxLength={MAXLENGTH}
    />
  );
};

export default DataArea;
