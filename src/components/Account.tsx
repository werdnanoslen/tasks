import React from 'react';
import { logoutUser } from '../api';

function Account({ isAuthed, hidden }) {
  const logout = async (e) => {
    await logoutUser().then(isAuthed).catch(console.error);
  };

  return (
    <footer hidden={hidden}>
      <button type="button" className="btn" onClick={logout}>
        Log out
      </button>
    </footer>
  );
}

export default Account;
