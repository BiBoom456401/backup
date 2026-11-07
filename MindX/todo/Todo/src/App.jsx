import React, { useState, useEffect } from 'react';
import './App.css';

function TodoApp() {
  const [tasks, setTasks] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const storedTasks = JSON.parse(localStorage.getItem('tasks'));
    if (storedTasks) {
      setTasks(storedTasks);
    }
  }, []);


  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleAddTask = () => {
    if (inputValue.trim() !== '') {
      setTasks([...tasks, { text: inputValue, completed: false }]);
      setInputValue('');
    }
  };

  const handleRemoveTask = (index) => {
    const newTasks = [...tasks];
    newTasks.splice(index, 1);
    setTasks(newTasks);
  };

  const handleToggleTask = (index) => {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], completed: !newTasks[index].completed };
    setTasks(newTasks);
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') {
      return true;
    } else if (filter === 'completed') {
      return task.completed;
    } else {
      return !task.completed;
    }
  });

  return (
    <div className="container">
      <div className="todo-app">
        <h1 className="todo-title">To-Do List</h1>
        <div className="input-container">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Enter task..."
            className="todo-input"
          />
          <button onClick={handleAddTask} className="add-button">Add Task</button>
        </div>
        <select value={filter} onChange={handleFilterChange} className="filter-select">
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
        <ul className="task-list">
          {filteredTasks.map((task, index) => (
            <li key={index} className={`task-item ${task.completed ? 'completed' : ''}`} onClick={() => handleToggleTask(index)}>
              {task.text}
              <button onClick={(event) => {event.stopPropagation(); handleRemoveTask(index)}} className="remove-button">Remove</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default TodoApp;
