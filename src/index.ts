#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { TodoistApi } from "@doist/todoist-api-typescript";

// Define tools
const CREATE_TASK_TOOL: Tool = {
  name: "todoist_create_task",
  description: "Create a new task in Todoist with optional description, due date, priority, project, and labels",
  inputSchema: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "The content/title of the task"
      },
      description: {
        type: "string",
        description: "Detailed description of the task (optional)"
      },
      due_string: {
        type: "string",
        description: "Natural language due date like 'tomorrow', 'next Monday', 'Jan 23' (optional)"
      },
      priority: {
        type: "number",
        description: "Task priority from 1 (normal) to 4 (urgent) (optional)",
        enum: [1, 2, 3, 4]
      },
      project_id: {
        type: "string",
        description: "Project ID to add the task to (optional)"
      },
      labels: {
        type: "array",
        items: { type: "string" },
        description: "Array of label names to add to the task (optional)"
      },
      section_id: {
        type: "string",
        description: "Section ID within the project (optional)"
      }
    },
    required: ["content"]
  }
};

const GET_TASKS_TOOL: Tool = {
  name: "todoist_get_tasks",
  description: "Get a list of tasks from Todoist with various filters",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "Filter tasks by project ID (optional)"
      },
      filter: {
        type: "string",
        description: "Natural language filter like 'today', 'tomorrow', 'next week', 'priority 1', 'overdue' (optional)"
      },
      priority: {
        type: "number",
        description: "Filter by priority level (1-4) (optional)",
        enum: [1, 2, 3, 4]
      },
      limit: {
        type: "number",
        description: "Maximum number of tasks to return (optional)",
        default: 10
      }
    }
  }
};

const UPDATE_TASK_TOOL: Tool = {
  name: "todoist_update_task",
  description: "Update an existing task in Todoist by searching for it by name and then updating it",
  inputSchema: {
    type: "object",
    properties: {
      task_name: {
        type: "string",
        description: "Name/content of the task to search for and update"
      },
      content: {
        type: "string",
        description: "New content/title for the task (optional)"
      },
      description: {
        type: "string",
        description: "New description for the task (optional)"
      },
      due_string: {
        type: "string",
        description: "New due date in natural language like 'tomorrow', 'next Monday' (optional)"
      },
      priority: {
        type: "number",
        description: "New priority level from 1 (normal) to 4 (urgent) (optional)",
        enum: [1, 2, 3, 4]
      }
    },
    required: ["task_name"]
  }
};

const DELETE_TASK_TOOL: Tool = {
  name: "todoist_delete_task",
  description: "Delete a task from Todoist by searching for it by name",
  inputSchema: {
    type: "object",
    properties: {
      task_name: {
        type: "string",
        description: "Name/content of the task to search for and delete"
      }
    },
    required: ["task_name"]
  }
};

const COMPLETE_TASK_TOOL: Tool = {
  name: "todoist_complete_task",
  description: "Mark a task as complete by searching for it by name",
  inputSchema: {
    type: "object",
    properties: {
      task_name: {
        type: "string",
        description: "Name/content of the task to search for and complete"
      }
    },
    required: ["task_name"]
  }
};

const REOPEN_TASK_TOOL: Tool = {
  name: "todoist_reopen_task",
  description: "Reopen a completed task by searching for it by name",
  inputSchema: {
    type: "object",
    properties: {
      task_name: {
        type: "string",
        description: "Name/content of the completed task to reopen"
      }
    },
    required: ["task_name"]
  }
};

const GET_PROJECTS_TOOL: Tool = {
  name: "todoist_get_projects",
  description: "Get all projects from Todoist",
  inputSchema: {
    type: "object",
    properties: {}
  }
};

const CREATE_PROJECT_TOOL: Tool = {
  name: "todoist_create_project",
  description: "Create a new project in Todoist",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the project"
      },
      color: {
        type: "string",
        description: "Color of the project (optional)"
      },
      is_favorite: {
        type: "boolean",
        description: "Whether to mark as favorite (optional)"
      }
    },
    required: ["name"]
  }
};

const GET_LABELS_TOOL: Tool = {
  name: "todoist_get_labels",
  description: "Get all personal labels from Todoist",
  inputSchema: {
    type: "object",
    properties: {}
  }
};

const CREATE_LABEL_TOOL: Tool = {
  name: "todoist_create_label",
  description: "Create a new personal label in Todoist",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the label"
      },
      color: {
        type: "string",
        description: "Color of the label (optional)"
      }
    },
    required: ["name"]
  }
};

const GET_SECTIONS_TOOL: Tool = {
  name: "todoist_get_sections",
  description: "Get all sections for a project",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "Project ID to get sections from (optional, gets all if not specified)"
      }
    }
  }
};

const CREATE_SECTION_TOOL: Tool = {
  name: "todoist_create_section",
  description: "Create a new section in a project",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the section"
      },
      project_id: {
        type: "string",
        description: "Project ID to create the section in"
      }
    },
    required: ["name", "project_id"]
  }
};

const ADD_COMMENT_TOOL: Tool = {
  name: "todoist_add_comment",
  description: "Add a comment to a task",
  inputSchema: {
    type: "object",
    properties: {
      task_name: {
        type: "string",
        description: "Name/content of the task to add comment to"
      },
      content: {
        type: "string",
        description: "The comment text"
      }
    },
    required: ["task_name", "content"]
  }
};

const SUGGEST_TASK_TOOL: Tool = {
  name: "todoist_suggest_task",
  description: "Create a task suggestion that can be approved or rejected later",
  inputSchema: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "The content/title of the suggested task"
      },
      description: {
        type: "string",
        description: "Detailed description of the suggested task (optional)"
      },
      due_string: {
        type: "string",
        description: "Natural language due date like 'tomorrow', 'next Monday', 'Jan 23' (optional)"
      },
      priority: {
        type: "number",
        description: "Task priority from 1 (normal) to 4 (urgent) (optional)",
        enum: [1, 2, 3, 4]
      },
      project_id: {
        type: "string",
        description: "Project ID to add the task to (optional)"
      },
      labels: {
        type: "array",
        items: { type: "string" },
        description: "Array of label names to add to the task (optional)"
      },
      section_id: {
        type: "string",
        description: "Section ID within the project (optional)"
      },
      reason: {
        type: "string",
        description: "Reason for suggesting this task (optional)"
      }
    },
    required: ["content"]
  }
};

const GET_SUGGESTIONS_TOOL: Tool = {
  name: "todoist_get_suggestions",
  description: "Get all pending task suggestions",
  inputSchema: {
    type: "object",
    properties: {}
  }
};

const APPROVE_SUGGESTION_TOOL: Tool = {
  name: "todoist_approve_suggestion",
  description: "Approve a task suggestion and convert it to a real task",
  inputSchema: {
    type: "object",
    properties: {
      suggestion_id: {
        type: "string",
        description: "ID of the suggestion task to approve"
      }
    },
    required: ["suggestion_id"]
  }
};

const REJECT_SUGGESTION_TOOL: Tool = {
  name: "todoist_reject_suggestion",
  description: "Reject and delete a task suggestion",
  inputSchema: {
    type: "object",
    properties: {
      suggestion_id: {
        type: "string",
        description: "ID of the suggestion task to reject"
      }
    },
    required: ["suggestion_id"]
  }
};

const GET_CONTEXT_TOOL: Tool = {
  name: "todoist_get_context",
  description: "Get high-level context about current tasks and projects (with a light touch to avoid overbiasing)",
  inputSchema: {
    type: "object",
    properties: {
      focus_area: {
        type: "string",
        description: "Optional area to focus context on (e.g., 'work', 'personal', 'urgent')"
      }
    }
  }
};

const REVIEW_PROGRESS_TOOL: Tool = {
  name: "todoist_review_progress",
  description: "Review current work and provide English suggestions for task management (ideas only, not actual changes)",
  inputSchema: {
    type: "object",
    properties: {
      work_description: {
        type: "string",
        description: "Brief description of what work was done"
      },
      session_type: {
        type: "string",
        description: "Type of work session (e.g., 'deep_work', 'planning', 'review', 'quick_tasks')"
      }
    }
  }
};

// Server implementation
const server = new Server(
  {
    name: "todoist-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Check for API token
const TODOIST_API_TOKEN = process.env.TODOIST_API_TOKEN!;
if (!TODOIST_API_TOKEN) {
  console.error("Error: TODOIST_API_TOKEN environment variable is required");
  process.exit(1);
}

// Initialize Todoist client
const todoistClient = new TodoistApi(TODOIST_API_TOKEN);

// Type guards for arguments
function isCreateTaskArgs(args: unknown): args is { 
  content: string;
  description?: string;
  due_string?: string;
  priority?: number;
  project_id?: string;
  labels?: string[];
  section_id?: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "content" in args &&
    typeof (args as { content: string }).content === "string"
  );
}

function isGetTasksArgs(args: unknown): args is { 
  project_id?: string;
  filter?: string;
  priority?: number;
  limit?: number;
} {
  return (
    typeof args === "object" &&
    args !== null
  );
}

function isUpdateTaskArgs(args: unknown): args is {
  task_name: string;
  content?: string;
  description?: string;
  due_string?: string;
  priority?: number;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "task_name" in args &&
    typeof (args as { task_name: string }).task_name === "string"
  );
}

function isDeleteTaskArgs(args: unknown): args is {
  task_name: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "task_name" in args &&
    typeof (args as { task_name: string }).task_name === "string"
  );
}

function isCompleteTaskArgs(args: unknown): args is {
  task_name: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "task_name" in args &&
    typeof (args as { task_name: string }).task_name === "string"
  );
}

function isReopenTaskArgs(args: unknown): args is {
  task_name: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "task_name" in args &&
    typeof (args as { task_name: string }).task_name === "string"
  );
}

function isCreateProjectArgs(args: unknown): args is {
  name: string;
  color?: string;
  is_favorite?: boolean;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "name" in args &&
    typeof (args as { name: string }).name === "string"
  );
}

function isCreateLabelArgs(args: unknown): args is {
  name: string;
  color?: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "name" in args &&
    typeof (args as { name: string }).name === "string"
  );
}

function isGetSectionsArgs(args: unknown): args is {
  project_id?: string;
} {
  return typeof args === "object" && args !== null;
}

function isCreateSectionArgs(args: unknown): args is {
  name: string;
  project_id: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "name" in args &&
    typeof (args as { name: string }).name === "string" &&
    "project_id" in args &&
    typeof (args as { project_id: string }).project_id === "string"
  );
}

function isAddCommentArgs(args: unknown): args is {
  task_name: string;
  content: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "task_name" in args &&
    typeof (args as { task_name: string }).task_name === "string" &&
    "content" in args &&
    typeof (args as { content: string }).content === "string"
  );
}

function isSuggestTaskArgs(args: unknown): args is { 
  content: string;
  description?: string;
  due_string?: string;
  priority?: number;
  project_id?: string;
  labels?: string[];
  section_id?: string;
  reason?: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "content" in args &&
    typeof (args as { content: string }).content === "string"
  );
}

function isApproveSuggestionArgs(args: unknown): args is {
  suggestion_id: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "suggestion_id" in args &&
    typeof (args as { suggestion_id: string }).suggestion_id === "string"
  );
}

function isRejectSuggestionArgs(args: unknown): args is {
  suggestion_id: string;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "suggestion_id" in args &&
    typeof (args as { suggestion_id: string }).suggestion_id === "string"
  );
}

function isGetContextArgs(args: unknown): args is {
  focus_area?: string;
} {
  return typeof args === "object" && args !== null;
}

function isReviewProgressArgs(args: unknown): args is {
  work_description?: string;
  session_type?: string;
} {
  return typeof args === "object" && args !== null;
}

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    CREATE_TASK_TOOL, 
    GET_TASKS_TOOL, 
    UPDATE_TASK_TOOL, 
    DELETE_TASK_TOOL, 
    COMPLETE_TASK_TOOL,
    REOPEN_TASK_TOOL,
    GET_PROJECTS_TOOL,
    CREATE_PROJECT_TOOL,
    GET_LABELS_TOOL,
    CREATE_LABEL_TOOL,
    GET_SECTIONS_TOOL,
    CREATE_SECTION_TOOL,
    ADD_COMMENT_TOOL,
    SUGGEST_TASK_TOOL,
    GET_SUGGESTIONS_TOOL,
    APPROVE_SUGGESTION_TOOL,
    REJECT_SUGGESTION_TOOL,
    GET_CONTEXT_TOOL,
    REVIEW_PROGRESS_TOOL
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (!args) {
      throw new Error("No arguments provided");
    }

    if (name === "todoist_create_task") {
      if (!isCreateTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_create_task");
      }
      const task = await todoistClient.addTask({
        content: args.content,
        description: args.description,
        dueString: args.due_string,
        priority: args.priority,
        projectId: args.project_id,
        labels: args.labels,
        sectionId: args.section_id
      });
      return {
        content: [{ 
          type: "text", 
          text: `Task created:\nTitle: ${task.content}${task.description ? `\nDescription: ${task.description}` : ''}${task.due ? `\nDue: ${task.due.string}` : ''}${task.priority ? `\nPriority: ${task.priority}` : ''}${task.labels?.length ? `\nLabels: ${task.labels.join(', ')}` : ''}` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_get_tasks") {
      if (!isGetTasksArgs(args)) {
        throw new Error("Invalid arguments for todoist_get_tasks");
      }
      
      // Only pass filter if at least one filtering parameter is provided
      const apiParams: any = {};
      if (args.project_id) {
        apiParams.projectId = args.project_id;
      }
      if (args.filter) {
        apiParams.filter = args.filter;
      }
      // If no filters provided, default to showing all tasks
      const tasks = await todoistClient.getTasks(Object.keys(apiParams).length > 0 ? apiParams : undefined);

      // Apply additional filters
      let filteredTasks = tasks;
      if (args.priority) {
        filteredTasks = filteredTasks.filter(task => task.priority === args.priority);
      }
      
      // Apply limit
      if (args.limit && args.limit > 0) {
        filteredTasks = filteredTasks.slice(0, args.limit);
      }
      
      const taskList = filteredTasks.map(task => 
        `- ${task.content}${task.description ? `\n  Description: ${task.description}` : ''}${task.due ? `\n  Due: ${task.due.string}` : ''}${task.priority ? `\n  Priority: ${task.priority}` : ''}`
      ).join('\n\n');
      
      return {
        content: [{ 
          type: "text", 
          text: filteredTasks.length > 0 ? taskList : "No tasks found matching the criteria" 
        }],
        isError: false,
      };
    }

    if (name === "todoist_update_task") {
      if (!isUpdateTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_update_task");
      }

      // First, search for the task
      const tasks = await todoistClient.getTasks();
      const matchingTask = tasks.find(task => 
        task.content.toLowerCase().includes(args.task_name.toLowerCase())
      );

      if (!matchingTask) {
        return {
          content: [{ 
            type: "text", 
            text: `Could not find a task matching "${args.task_name}"` 
          }],
          isError: true,
        };
      }

      // Build update data
      const updateData: any = {};
      if (args.content) updateData.content = args.content;
      if (args.description) updateData.description = args.description;
      if (args.due_string) updateData.dueString = args.due_string;
      if (args.priority) updateData.priority = args.priority;

      const updatedTask = await todoistClient.updateTask(matchingTask.id, updateData);
      
      return {
        content: [{ 
          type: "text", 
          text: `Task "${matchingTask.content}" updated:\nNew Title: ${updatedTask.content}${updatedTask.description ? `\nNew Description: ${updatedTask.description}` : ''}${updatedTask.due ? `\nNew Due Date: ${updatedTask.due.string}` : ''}${updatedTask.priority ? `\nNew Priority: ${updatedTask.priority}` : ''}` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_delete_task") {
      if (!isDeleteTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_delete_task");
      }

      // First, search for the task
      const tasks = await todoistClient.getTasks();
      const matchingTask = tasks.find(task => 
        task.content.toLowerCase().includes(args.task_name.toLowerCase())
      );

      if (!matchingTask) {
        return {
          content: [{ 
            type: "text", 
            text: `Could not find a task matching "${args.task_name}"` 
          }],
          isError: true,
        };
      }

      // Delete the task
      await todoistClient.deleteTask(matchingTask.id);
      
      return {
        content: [{ 
          type: "text", 
          text: `Successfully deleted task: "${matchingTask.content}"` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_complete_task") {
      if (!isCompleteTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_complete_task");
      }

      // First, search for the task
      const tasks = await todoistClient.getTasks();
      const matchingTask = tasks.find(task => 
        task.content.toLowerCase().includes(args.task_name.toLowerCase())
      );

      if (!matchingTask) {
        return {
          content: [{ 
            type: "text", 
            text: `Could not find a task matching "${args.task_name}"` 
          }],
          isError: true,
        };
      }

      // Complete the task
      await todoistClient.closeTask(matchingTask.id);
      
      return {
        content: [{ 
          type: "text", 
          text: `Successfully completed task: "${matchingTask.content}"` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_reopen_task") {
      if (!isReopenTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_reopen_task");
      }

      // First, search for the completed task
      const tasks = await todoistClient.getTasks();
      const matchingTask = tasks.find(task => 
        task.content.toLowerCase().includes(args.task_name.toLowerCase())
      );

      if (!matchingTask) {
        return {
          content: [{ 
            type: "text", 
            text: `Could not find a task matching "${args.task_name}"` 
          }],
          isError: true,
        };
      }

      // Reopen the task
      await todoistClient.reopenTask(matchingTask.id);
      
      return {
        content: [{ 
          type: "text", 
          text: `Successfully reopened task: "${matchingTask.content}"` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_get_projects") {
      const projects = await todoistClient.getProjects();
      const projectList = projects.map(project => 
        `- ${project.name}${project.isFavorite ? ' ⭐' : ''} (ID: ${project.id})`
      ).join('\n');
      
      return {
        content: [{ 
          type: "text", 
          text: projects.length > 0 ? `Projects:\n${projectList}` : "No projects found" 
        }],
        isError: false,
      };
    }

    if (name === "todoist_create_project") {
      if (!isCreateProjectArgs(args)) {
        throw new Error("Invalid arguments for todoist_create_project");
      }
      const project = await todoistClient.addProject({
        name: args.name,
        color: args.color,
        isFavorite: args.is_favorite
      });
      return {
        content: [{ 
          type: "text", 
          text: `Project created: ${project.name} (ID: ${project.id})` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_get_labels") {
      const labels = await todoistClient.getLabels();
      const labelList = labels.map(label => 
        `- ${label.name} (ID: ${label.id})`
      ).join('\n');
      
      return {
        content: [{ 
          type: "text", 
          text: labels.length > 0 ? `Labels:\n${labelList}` : "No labels found" 
        }],
        isError: false,
      };
    }

    if (name === "todoist_create_label") {
      if (!isCreateLabelArgs(args)) {
        throw new Error("Invalid arguments for todoist_create_label");
      }
      const label = await todoistClient.addLabel({
        name: args.name,
        color: args.color
      });
      return {
        content: [{ 
          type: "text", 
          text: `Label created: ${label.name} (ID: ${label.id})` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_get_sections") {
      if (!isGetSectionsArgs(args)) {
        throw new Error("Invalid arguments for todoist_get_sections");
      }
      const sections = args.project_id 
        ? await todoistClient.getSections(args.project_id)
        : await todoistClient.getSections();
      
      const sectionList = sections.map(section => 
        `- ${section.name} (ID: ${section.id}, Project: ${section.projectId})`
      ).join('\n');
      
      return {
        content: [{ 
          type: "text", 
          text: sections.length > 0 ? `Sections:\n${sectionList}` : "No sections found" 
        }],
        isError: false,
      };
    }

    if (name === "todoist_create_section") {
      if (!isCreateSectionArgs(args)) {
        throw new Error("Invalid arguments for todoist_create_section");
      }
      const section = await todoistClient.addSection({
        name: args.name,
        projectId: args.project_id
      });
      return {
        content: [{ 
          type: "text", 
          text: `Section created: ${section.name} (ID: ${section.id})` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_add_comment") {
      if (!isAddCommentArgs(args)) {
        throw new Error("Invalid arguments for todoist_add_comment");
      }

      // First, search for the task
      const tasks = await todoistClient.getTasks();
      const matchingTask = tasks.find(task => 
        task.content.toLowerCase().includes(args.task_name.toLowerCase())
      );

      if (!matchingTask) {
        return {
          content: [{ 
            type: "text", 
            text: `Could not find a task matching "${args.task_name}"` 
          }],
          isError: true,
        };
      }

      // Add comment to the task
      const comment = await todoistClient.addComment({
        taskId: matchingTask.id,
        content: args.content
      });
      
      return {
        content: [{ 
          type: "text", 
          text: `Comment added to "${matchingTask.content}": ${comment.content}` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_suggest_task") {
      if (!isSuggestTaskArgs(args)) {
        throw new Error("Invalid arguments for todoist_suggest_task");
      }

      // Ensure the __suggestion__ label exists
      let suggestionLabel;
      try {
        const labels = await todoistClient.getLabels();
        suggestionLabel = labels.find(label => label.name === "__suggestion__");
        if (!suggestionLabel) {
          suggestionLabel = await todoistClient.addLabel({
            name: "__suggestion__",
            color: "orange"
          });
        }
      } catch (error) {
        suggestionLabel = await todoistClient.addLabel({
          name: "__suggestion__",
          color: "orange"
        });
      }

      // Generate AI summary of the suggestion
      const suggestionContext = [
        `Task: ${args.content}`,
        args.description ? `Description: ${args.description}` : '',
        args.due_string ? `Due: ${args.due_string}` : '',
        args.priority ? `Priority: ${args.priority}` : '',
        args.reason ? `Reason: ${args.reason}` : '',
        args.labels ? `Labels: ${args.labels.join(', ')}` : ''
      ].filter(Boolean).join('\n');

      const aiSummary = `📝 AI SUMMARY: This suggestion adds "${args.content}" to your task list${args.due_string ? ` for ${args.due_string}` : ''}${args.priority && args.priority > 2 ? ' with high priority' : ''}${args.reason ? `. The reason given is: ${args.reason}` : ''}${args.description ? `. The task involves: ${args.description}` : ''}.`;

      // Create suggestion metadata
      const suggestionData = {
        original_content: args.content,
        original_description: args.description,
        original_due_string: args.due_string,
        original_priority: args.priority,
        original_project_id: args.project_id,
        original_labels: args.labels,
        original_section_id: args.section_id,
        reason: args.reason,
        ai_summary: aiSummary,
        created_at: new Date().toISOString()
      };

      // Create the suggestion task
      const suggestionLabels = ["__suggestion__"];
      if (args.labels) {
        suggestionLabels.push(...args.labels);
      }

      const task = await todoistClient.addTask({
        content: `📋 SUGGESTION: ${args.content}`,
        description: `SUGGESTION_METADATA: ${JSON.stringify(suggestionData)}\n\n${aiSummary}${args.description ? `\n\nOriginal Description: ${args.description}` : ''}${args.reason ? `\n\nReason: ${args.reason}` : ''}`,
        labels: suggestionLabels,
        priority: 1 // Low priority for suggestions
      });

      return {
        content: [{ 
          type: "text", 
          text: `Suggestion created: "${args.content}"\nSuggestion ID: ${task.id}\n\n${aiSummary}${args.reason ? `\n\nReason: ${args.reason}` : ''}` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_get_suggestions") {
      // Get all tasks with the __suggestion__ label
      const tasks = await todoistClient.getTasks();
      const suggestions = tasks.filter(task => 
        task.labels?.includes("__suggestion__") && 
        task.content.startsWith("📋 SUGGESTION:")
      );

      if (suggestions.length === 0) {
        return {
          content: [{ 
            type: "text", 
            text: "No pending suggestions found" 
          }],
          isError: false,
        };
      }

      const suggestionList = suggestions.map(suggestion => {
        const originalContent = suggestion.content.replace("📋 SUGGESTION: ", "");
        let reason = "";
        let aiSummary = "";
        
        // Extract reason and AI summary from description if present
        if (suggestion.description) {
          const reasonMatch = suggestion.description.match(/Reason: (.+?)(?:\n|$)/);
          if (reasonMatch) {
            reason = ` (${reasonMatch[1]})`;
          }
          
          const summaryMatch = suggestion.description.match(/📝 AI SUMMARY: (.+?)(?:\n|$)/);
          if (summaryMatch) {
            aiSummary = `\n  Summary: ${summaryMatch[1]}`;
          }
        }
        
        return `- ${originalContent}${reason}${aiSummary}\n  ID: ${suggestion.id}`;
      }).join('\n\n');

      return {
        content: [{ 
          type: "text", 
          text: `Pending Suggestions:\n\n${suggestionList}` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_approve_suggestion") {
      if (!isApproveSuggestionArgs(args)) {
        throw new Error("Invalid arguments for todoist_approve_suggestion");
      }

      // Get the suggestion task
      const tasks = await todoistClient.getTasks();
      const suggestionTask = tasks.find(task => 
        task.id === args.suggestion_id && 
        task.labels?.includes("__suggestion__")
      );

      if (!suggestionTask) {
        return {
          content: [{ 
            type: "text", 
            text: `Could not find a suggestion with ID "${args.suggestion_id}"` 
          }],
          isError: true,
        };
      }

      // Extract original task data from description
      let originalData = null;
      if (suggestionTask.description) {
        const metadataMatch = suggestionTask.description.match(/SUGGESTION_METADATA: ({.*?})/);
        if (metadataMatch) {
          try {
            originalData = JSON.parse(metadataMatch[1]);
          } catch (error) {
            // Fallback to basic data
          }
        }
      }

      // Create the real task with original parameters
      const originalContent = suggestionTask.content.replace("📋 SUGGESTION: ", "");
      const realTaskData: any = {
        content: originalContent
      };

      if (originalData) {
        if (originalData.original_description) realTaskData.description = originalData.original_description;
        if (originalData.original_due_string) realTaskData.dueString = originalData.original_due_string;
        if (originalData.original_priority) realTaskData.priority = originalData.original_priority;
        if (originalData.original_project_id) realTaskData.projectId = originalData.original_project_id;
        if (originalData.original_section_id) realTaskData.sectionId = originalData.original_section_id;
        if (originalData.original_labels) realTaskData.labels = originalData.original_labels;
      }

      const realTask = await todoistClient.addTask(realTaskData);

      // Delete the suggestion task
      await todoistClient.deleteTask(suggestionTask.id);

      return {
        content: [{ 
          type: "text", 
          text: `Suggestion approved and converted to task: "${realTask.content}"` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_reject_suggestion") {
      if (!isRejectSuggestionArgs(args)) {
        throw new Error("Invalid arguments for todoist_reject_suggestion");
      }

      // Get the suggestion task
      const tasks = await todoistClient.getTasks();
      const suggestionTask = tasks.find(task => 
        task.id === args.suggestion_id && 
        task.labels?.includes("__suggestion__")
      );

      if (!suggestionTask) {
        return {
          content: [{ 
            type: "text", 
            text: `Could not find a suggestion with ID "${args.suggestion_id}"` 
          }],
          isError: true,
        };
      }

      const originalContent = suggestionTask.content.replace("📋 SUGGESTION: ", "");

      // Delete the suggestion task
      await todoistClient.deleteTask(suggestionTask.id);

      return {
        content: [{ 
          type: "text", 
          text: `Suggestion rejected and deleted: "${originalContent}"` 
        }],
        isError: false,
      };
    }

    if (name === "todoist_get_context") {
      if (!isGetContextArgs(args)) {
        throw new Error("Invalid arguments for todoist_get_context");
      }

      // Get current tasks and projects
      const [tasks, projects] = await Promise.all([
        todoistClient.getTasks(),
        todoistClient.getProjects()
      ]);

      // Filter tasks based on focus area if provided
      let relevantTasks = tasks;
      if (args.focus_area) {
        if (args.focus_area === 'urgent') {
          relevantTasks = tasks.filter(t => t.priority && t.priority >= 3);
        } else if (args.focus_area === 'today') {
          relevantTasks = tasks.filter(t => t.due?.string?.includes('today'));
        } else {
          // Filter by label or project name containing focus area
          relevantTasks = tasks.filter(t => 
            t.labels?.some(l => l.toLowerCase().includes(args.focus_area!.toLowerCase())) ||
            projects.find(p => p.id === t.projectId)?.name.toLowerCase().includes(args.focus_area!.toLowerCase())
          );
        }
      }

      // Create a light context summary
      const projectSummary = projects
        .filter(p => p.name !== 'Inbox')
        .slice(0, 3)
        .map(p => p.name)
        .join(', ');

      const taskPriorities = {
        high: relevantTasks.filter(t => t.priority && t.priority >= 3).length,
        medium: relevantTasks.filter(t => t.priority === 2).length,
        low: relevantTasks.filter(t => !t.priority || t.priority === 1).length
      };

      const dueSoon = relevantTasks.filter(t => 
        t.due?.string && (
          t.due.string.includes('today') || 
          t.due.string.includes('tomorrow') ||
          t.due.string.includes('week')
        )
      ).length;

      const contextSummary = `📊 LIGHT CONTEXT:
Currently tracking ${relevantTasks.length} active tasks${args.focus_area ? ` (filtered: ${args.focus_area})` : ''}.
Main projects: ${projectSummary || 'None specific'}
Priority distribution: ${taskPriorities.high} high, ${taskPriorities.medium} medium, ${taskPriorities.low} low
${dueSoon > 0 ? `${dueSoon} tasks due soon` : 'No immediate deadlines'}

💡 This is a gentle overview - interpret flexibly based on current needs.`;

      return {
        content: [{ 
          type: "text", 
          text: contextSummary
        }],
        isError: false,
      };
    }

    if (name === "todoist_review_progress") {
      if (!isReviewProgressArgs(args)) {
        throw new Error("Invalid arguments for todoist_review_progress");
      }

      // Get current tasks to analyze
      const tasks = await todoistClient.getTasks();
      
      // Analyze task patterns
      const suggestions = [];
      
      // Check for stale high-priority tasks
      const stalePriorityTasks = tasks.filter(t => 
        t.priority && t.priority >= 3 && 
        t.createdAt && new Date(t.createdAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      
      if (stalePriorityTasks.length > 0) {
        suggestions.push(`📌 Consider reviewing ${stalePriorityTasks.length} high-priority tasks that have been open for over a week`);
      }

      // Check for tasks without due dates
      const undatedTasks = tasks.filter(t => !t.due && t.priority && t.priority >= 2);
      if (undatedTasks.length > 0) {
        suggestions.push(`📅 You might want to add due dates to ${undatedTasks.length} important tasks`);
      }

      // Session-specific suggestions
      if (args.session_type === 'deep_work' && args.work_description) {
        suggestions.push(`✅ If you completed deep work on "${args.work_description}", consider marking related tasks as complete`);
        suggestions.push(`🔄 You might want to create follow-up tasks for any discoveries or next steps`);
      } else if (args.session_type === 'planning') {
        suggestions.push(`📝 Planning sessions often reveal new tasks - consider adding any you identified`);
        suggestions.push(`🎯 Review task priorities based on your planning insights`);
      } else if (args.session_type === 'quick_tasks') {
        const lowPriorityCount = tasks.filter(t => !t.priority || t.priority === 1).length;
        if (lowPriorityCount > 5) {
          suggestions.push(`🧹 Great time to tackle some of your ${lowPriorityCount} low-priority tasks`);
        }
      }

      // General suggestions based on task count
      if (tasks.length > 20) {
        suggestions.push(`📊 With ${tasks.length} active tasks, consider archiving or delegating some`);
      }
      
      if (tasks.filter(t => !t.labels || t.labels.length === 0).length > 10) {
        suggestions.push(`🏷️ Many tasks lack labels - organizing them might improve your workflow`);
      }

      const progressReview = `🔄 PROGRESS REVIEW${args.work_description ? ` (${args.work_description})` : ''}

${suggestions.length > 0 ? suggestions.join('\n\n') : '✨ Your task list looks well-organized!'}

💭 These are gentle suggestions - use your judgment about what makes sense for your workflow.
To create actual task suggestions, explicitly ask me to "suggest tasks" based on these ideas.`;

      return {
        content: [{ 
          type: "text", 
          text: progressReview
        }],
        isError: false,
      };
    }

    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Todoist MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});