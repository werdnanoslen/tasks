import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ListItem } from '../tasks/task.model';
import classNames from 'classnames';

interface ChecklistItemProps extends ListItem {
  deleteListItem: (id: string) => void;
  toggleListItemDone: (id: string) => void;
  children?: React.ReactNode;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({
  id,
  done,
  deleteListItem,
  toggleListItemDone,
  children,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({
    id: id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      key={id}
      ref={setNodeRef}
      style={style}
      className={classNames('checklist-item', { done: done })}
    >
      <div className="list-controls">
        <button
          className="btn btn__icon btn__drag"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
        >
          <span className="visually-hidden">Move list item</span>
          <span className="ascii-icon" aria-hidden="true">
            {String.fromCharCode(8661)}
          </span>
        </button>
        <input
          type="checkbox"
          checked={done}
          aria-label="done"
          onChange={() => toggleListItemDone(id)}
        />
      </div>
      {children}
      <button
        className="btn btn__icon btn__close"
        onClick={() => deleteListItem(id)}
      >
        <span className="ascii-icon" aria-hidden="true">
          {String.fromCharCode(10005)}
        </span>
        <span className="visually-hidden">Delete list item</span>
      </button>
    </li>
  );
};

export default ChecklistItem;
