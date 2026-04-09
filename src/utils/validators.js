function isValidTaskTitle(title) {
  return Boolean(title && title.trim().length > 0 && title.trim().length <= 200);
}

function isValidTaskStatus(status) {
  const validStatuses = ['open', 'in_progress', 'done'];
  return validStatuses.includes(status);
}

module.exports = {
  isValidTaskTitle,
  isValidTaskStatus,
};
