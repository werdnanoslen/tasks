import React from 'react';
import PropTypes from 'prop-types';

function Account({ setToken }) {
  const handleLogout = async (e) => {
    setToken('');
  };

  return (
    <footer>
      <button type="button" className="btn" onClick={handleLogout}>
        Log out
      </button>
    </footer>
  );
}

Account.propTypes = {
  setToken: PropTypes.func.isRequired,
};

export default Account;
