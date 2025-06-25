"use client";

import React, { useState, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { format } from "date-fns";
import styles from "./TodoList.module.css";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  createdAt: number;
}

type FilterType = "all" | "active" | "completed";
type SortType = "priority" | "date" | "alphabetical";

function Page() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("date");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setTodos([
      ...todos,
      {
        id: Date.now(),
        text: input.trim(),
        completed: false,
        priority: "medium",
        createdAt: Date.now(),
      },
    ]);
    setInput("");
  };

  const handleToggle = (id: number) => {
    setTodos((todos) =>
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleDelete = (id: number) => {
    setTodos((todos) => todos.filter((todo) => todo.id !== id));
  };

  const handlePriorityChange = (id: number) => {
    setTodos((todos) =>
      todos.map((todo) => {
        if (todo.id !== id) return todo;
        const priorities: ("high" | "medium" | "low")[] = [
          "high",
          "medium",
          "low",
        ];
        const currentIndex = priorities.indexOf(todo.priority);
        const nextPriority = priorities[(currentIndex + 1) % priorities.length];
        return { ...todo, priority: nextPriority };
      })
    );
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(filteredAndSortedTodos());
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    if (filter === "all" && sortBy === "date") {
      setTodos(reordered);
    }
  };

  const filteredAndSortedTodos = useCallback(() => {
    let result = [...todos];

    if (filter === "active") {
      result = result.filter((todo) => !todo.completed);
    } else if (filter === "completed") {
      result = result.filter((todo) => todo.completed);
    }

    switch (sortBy) {
      case "priority":
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        result.sort(
          (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
        );
        break;
      case "date":
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case "alphabetical":
        result.sort((a, b) => a.text.localeCompare(b.text));
        break;
    }

    return result;
  }, [todos, filter, sortBy]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Task Manager</h1>

      <div className={styles.controls}>
        <button
          className={`${styles.filterButton} ${
            filter === "all" ? styles.active : ""
          }`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={`${styles.filterButton} ${
            filter === "active" ? styles.active : ""
          }`}
          onClick={() => setFilter("active")}
        >
          Active
        </button>
        <button
          className={`${styles.filterButton} ${
            filter === "completed" ? styles.active : ""
          }`}
          onClick={() => setFilter("completed")}
        >
          Completed
        </button>
        <select
          className={styles.filterButton}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortType)}
        >
          <option value="date">Sort by Date</option>
          <option value="priority">Sort by Priority</option>
          <option value="alphabetical">Sort Alphabetically</option>
        </select>
      </div>

      <form className={styles.form} onSubmit={handleAdd}>
        <input
          className={styles.input}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a new task..."
        />
        <button className={styles.button} type="submit">
          Add Task
        </button>
      </form>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="todo-list">
          {(provided) => (
            <ul
              className={styles.list}
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {filteredAndSortedTodos().map((todo, index) => (
                <Draggable
                  key={todo.id}
                  draggableId={todo.id.toString()}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`${styles.item} ${styles[todo.priority]}${
                        snapshot.isDragging ? " " + styles.dragging : ""
                      }`}
                      style={{
                        cursor: "pointer",
                        ...provided.draggableProps.style,
                      }}
                      onClick={(e) => {
                        // Prevent toggling if clicking on an action button
                        if ((e.target as HTMLElement).closest("button")) return;
                        handleToggle(todo.id);
                      }}
                    >
                      <span className={styles.dragHandle}>☰</span>
                      <span
                        className={
                          todo.completed
                            ? `${styles.text} ${styles.completed}`
                            : styles.text
                        }
                      >
                        {todo.text}
                        <br />
                        <span style={{ fontSize: "0.85em", color: "#888" }}>
                          Added: {format(new Date(todo.createdAt), "PPpp")}
                        </span>
                      </span>
                      <div className={styles.actions}>
                        <button
                          className={`${styles.priorityBtn} ${
                            styles[todo.priority]
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePriorityChange(todo.id);
                          }}
                        >
                          {todo.priority.charAt(0).toUpperCase() +
                            todo.priority.slice(1)}
                        </button>
                        <button
                          className={styles.actionBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(todo.id);
                          }}
                          aria-label="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

export default Page;
