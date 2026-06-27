import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';

interface DataAreaProps {
  id: string;
  handleInput: (
    e: React.FormEvent<HTMLTextAreaElement>,
    index?: number
  ) => void;
  setIsEditing: (isEditing: boolean) => void;
  handleBlur?: () => void;
  updateChecklistItem?: (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    index: number
  ) => void;
  index?: number;
  done?: boolean;
  data?: string;
  newTask?: boolean;
  focusThis?: boolean;
}

const DataArea = React.memo(function DataArea({
  id,
  handleInput,
  setIsEditing,
  handleBlur,
  updateChecklistItem,
  index,
  done,
  data,
  newTask,
  focusThis,
}: DataAreaProps) {
  const placeholderLabel = newTask ? 'Type to add a task' : undefined;
  const ariaLabel = newTask ? 'Type to add a task' : 'Edit task';
  const MAXLENGTH = 1000;
  const newItemRef = useRef<HTMLTextAreaElement>(null);
  const shouldAutoFocus = !!(newTask || focusThis);
  const [isFocused, setIsFocused] = useState(false);
  const showView = !isFocused && !newTask;

  function renderWithLinks(text: string): React.ReactNode[] {
    return text.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
      /^https?:\/\//.test(part) ? (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-link"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      )
    );
  }
  if ((undefined === updateChecklistItem) !== (undefined === index)) {
    console.error(
      'updateChecklistItem and index must all be defined or undefined, id:',
      id
    );
  }
  const isAList = updateChecklistItem && undefined !== index;

  function keydown(e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.stopPropagation();
    }
    if (isAList) updateChecklistItem(e, index);
  }

  useEffect(() => {
    if (shouldAutoFocus) {
      newItemRef.current?.focus();
    }
  }, [shouldAutoFocus]);

  useEffect(() => {
    const el = newItemRef.current;
    if (el) {
      const { selectionStart, selectionEnd } = el;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
      el.setSelectionRange(selectionStart, selectionEnd);
    }
  }, [data, isFocused]);

  return (
    <>
      {showView ? (
        <div
          className={classNames('input input--view', { done })}
          onClick={() => {
            setIsFocused(true);
            setTimeout(() => newItemRef.current?.focus(), 0);
          }}
        >
          {renderWithLinks(data || '')}
        </div>
      ) : (
        <textarea
          id={`edit-${id}`}
          name="data"
          className={classNames('input', { done: done })}
          value={data}
          onKeyDown={keydown}
          onInput={(e) => handleInput(e, index)}
          onFocus={() => {
            setIsFocused(true);
            setIsEditing(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            handleBlur && handleBlur();
          }}
          placeholder={placeholderLabel}
          aria-label={ariaLabel}
          rows={1}
          ref={newItemRef}
          autoFocus={shouldAutoFocus || isFocused}
          maxLength={MAXLENGTH}
        />
      )}
    </>
  );
});
export default DataArea;
