import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import * as API from '../api';

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
  showLinkPreview?: boolean;
}

function DataArea({
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
  showLinkPreview = true,
}: DataAreaProps) {
  const placeholderLabel = newTask ? 'Type to add a task' : undefined;
  const ariaLabel = newTask ? 'Type to add a task' : 'Edit task';
  const MAXLENGTH = 1000;
  const newItemRef = useRef<HTMLTextAreaElement>(null);
  const shouldAutoFocus = !!(newTask || focusThis);
  const [linkMetadataList, setLinkMetadataList] = useState<{ title: string; favicon: string; url: string }[]>([]);
  
  // Extract URLs from text
  const urlRegex = /https?:\/\/[^\s]+/gi;
  const urls = (data || '').match(urlRegex) || [];
  const urlsKey = urls.join(',');

  useEffect(() => {
    if (urls.length > 0 && !newTask && showLinkPreview) {
      Promise.all(
        urls.map(url => 
          API.getLinkMetadata(url).catch(() => null)
        )
      ).then(results => {
        const validResults = results.filter(r => r !== null) as { title: string; favicon: string; url: string }[];
        setLinkMetadataList(validResults);
      });
    } else {
      setLinkMetadataList([]);
    }
  }, [urlsKey, newTask]); // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <>
      {linkMetadataList.map((linkMetadata, index) => (
        <a 
          key={linkMetadata.url + index}
          href={linkMetadata.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="link-button"
          title={linkMetadata.title}
        >
          {linkMetadata.favicon && (
            <img src={linkMetadata.favicon} alt="" className="link-favicon" onError={(e) => e.currentTarget.style.display = 'none'} />
          )}
          <span className="link-title">{linkMetadata.title}</span>
        </a>
      ))}
      <TextareaAutosize
        id={`edit-${id}`}
        name="data"
        className={classNames('input', { done: done })}
        value={data}
        onKeyDown={keydown}
        onInput={(e) => handleInput(e, index)}
        onFocus={() => setIsEditing(true)}
        onBlur={() => handleBlur && handleBlur()}
        placeholder={placeholderLabel}
        aria-label={ariaLabel}
        rows={1}
        ref={shouldAutoFocus ? newItemRef : null}
        autoFocus={shouldAutoFocus}
        maxLength={MAXLENGTH}
      />
    </>
  );
}
export default DataArea;
