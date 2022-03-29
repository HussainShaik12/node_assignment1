const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const { format } = require("date-fns");

const path = require("path");
const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server started");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  const { search_q, status, priority, category } = request.query;
  let getTodosQuery = "";

  switch (true) {
    case hasStatusProperty(request.query):
      getTodosQuery = `select * from todo where todo LIKE '${search_q}'
and status = '${status}';`;
      break;

    case hasPriorityProperty(request.query):
      getTodosQuery = `select * from todo where todo LIKE '${search_q}'
and priority = '${priority}';`;
      break;

    case hasCategoryProperty(request.query):
      getTodosQuery = `select * from todo where todo LIKE '${search_q}'
and category = '${category}';`;
      break;

    case hasPriorityAndStatusProperty(request.query):
      getTodosQuery = `select * from todo where todo LIKE '${search_q}'
AND status = '${status}' AND priority = '${priority}';`;
      break;

    case hasCategoryAndStatusProperty(request.query):
      getTodosQuery = `select * from todo where todo LIKE '${search_q}'
and status = '${status}' AND category = '${category}';`;
      break;

    case hasCategoryAndPriorityProperty(request.query):
      getTodosQuery = `select * from todo where todo LIKE '${search_q}'
and category = '${category}' AND priority = '${priority}';`;
      break;

    default:
      getTodosQuery = `select * from todo where todo LIKE '${search_q}';`;
      break;
  }

  data = await database.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const todoId = request.params;

  const getTodoQuery = `select * from todo where id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(todo);
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const formattedDate = format(date, "yyyy-MM-dd");

  const getAgendaQuery = `select * from todo where dueDate = '${formattedDate}';`;
  const agenda = await database.all(getAgendaQuery);
  response.send(agenda);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, status, priority, category, dueDate } = request.body;
  const addTodoQuery = `insert into todo (id,todo,status,priority,category,dueDate)
values (${id},${todo},${status},${priority},${category},${dueDate});`;
  await database.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  let updatedColumn = "";
  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;
    case requestBody.category !== undefined:
      updatedColumn = "Category";
      break;
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;
    default:
      updatedColumn = "Todo";
      break;
  }

  const previousTodoQuery = `select * from todo where id = '${todoId}';`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    category = previousTodo.category,
    status = previousTodo.status,
    priority = previousTodo.priority,
  } = request.body;

  const updateTodoQuery = `Update todo SET todo='${todo}',
priority='${priority}',
status='${status}'
WHERE
id = ${todoId};`;
  await database.run(updateTodoQuery);
  response.send(`${updatedColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `Delete from todo where id = '${todoId}';`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
