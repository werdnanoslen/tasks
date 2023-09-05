import React from 'react';

function FilterButton(props) {
  return (
    <button
      type="button"
      className="btn"
      aria-pressed={props.isPressed}
      onClick={() => props.setFilter(props.data)}
      aria-label={`Show ${props.data} tasks`}
    >
      {props.data}
    </button>
  );
}

export default FilterButton;
