import React from 'react';
import { ListItem } from '../tasks/task.model';

interface ChecklistItemProps {
  children: React.ReactNode;
  item: ListItem;
  deleteListItem: (id: string) => void;
  toggleListItemDone: (id: string) => void;
}

const ChecklistItem = React.memo(function ChecklistItem({
  children,
  item,
  deleteListItem,
  toggleListItemDone,
}: ChecklistItemProps) {
  return (
    <li key={item.id}>
      <div className="list-controls">
        <span className="btn btn__icon btn__drag" aria-label="Move list item">
          <span className="visually-hidden">Move list item</span>
          <span className="ascii-icon" aria-hidden="true">
            {String.fromCharCode(0x205e) + String.fromCharCode(0x205e)}
          </span>
        </span>
        <input
          type="checkbox"
          checked={item.done}
          aria-label="done"
          onChange={() => toggleListItemDone(item.id)}
        />
      </div>
      {children}
      <button
        type="button"
        className="btn btn__icon btn__close"
        onClick={() => deleteListItem(item.id)}
      >
        <span className="ascii-icon" aria-hidden="true">
          {String.fromCharCode(10005)}
        </span>
        <span className="visually-hidden">Delete list item</span>
      </button>
    </li>
  );
});
export default ChecklistItem;
