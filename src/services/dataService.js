const tasksRepo = require('../db/tasksRepo');

async function createTask(userId, title) {
  return tasksRepo.createTask({ userId, title });
}

async function getTask(taskId) {
  return tasksRepo.getTask(taskId);
}

async function listTasks(filters = {}) {
  return tasksRepo.listTasks(filters);
}

async function updateTask(taskId, updates) {
  return tasksRepo.updateTask(taskId, updates);
}

async function deleteTask(taskId) {
  return tasksRepo.deleteTask(taskId);
}

async function getActiveTaskCount() {
  return tasksRepo.countTasks();
}

async function logEvent(eventType, { userId, taskId, metadata } = {}) {
  return tasksRepo.insertEvent({ eventType, userId, taskId, metadata });
}

async function markTaskDoneBySlackMessage({ channel, messageTs }) {
  return tasksRepo.updateTaskStatusBySlackMessage({
    channel,
    messageTs,
    status: 'done',
  });
}

module.exports = {
  createTask,
  getTask,
  listTasks,
  updateTask,
  deleteTask,
  getActiveTaskCount,
  logEvent,
  markTaskDoneBySlackMessage,
};
