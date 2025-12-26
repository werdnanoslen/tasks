import React from 'react';

interface FilterButtonProps {
  isPressed: boolean;
  setFilter: (filter: string) => void;
  data: string;
}

const FilterButton = React.memo(function FilterButton(props: FilterButtonProps) {
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
});

export default FilterButton;
