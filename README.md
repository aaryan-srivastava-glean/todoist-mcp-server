# Todoist MCP Server
[![smithery badge](https://smithery.ai/badge/@abhiz123/todoist-mcp-server)](https://smithery.ai/server/@abhiz123/todoist-mcp-server)

An MCP (Model Context Protocol) server implementation that integrates Claude with Todoist, enabling natural language task management. This server allows Claude to interact with your Todoist tasks using everyday language.

<a href="https://glama.ai/mcp/servers/fhaif4fv1w">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/fhaif4fv1w/badge" alt="Todoist Server MCP server" />
</a>

## Features

* **Natural Language Task Management**: Create, update, complete, delete, and reopen tasks using everyday language
* **Smart Task Search**: Find tasks using partial name matches
* **Flexible Filtering**: Filter tasks by due date, priority, and other attributes
* **Rich Task Details**: Support for descriptions, due dates, priority levels, labels, and sections
* **Project Management**: Create and list projects, organize tasks within projects
* **Labels & Categories**: Create and apply labels to tasks for better organization
* **Sections**: Organize tasks within projects using sections
* **Comments**: Add notes and discussions to tasks
* **Intuitive Error Handling**: Clear feedback for better user experience

## Installation

### Installing via Smithery

To install Todoist MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@abhiz123/todoist-mcp-server):

```bash
npx -y @smithery/cli install @abhiz123/todoist-mcp-server --client claude
```

### Manual Installation
```bash
npm install -g @abhiz123/todoist-mcp-server
```

## Tools

### Task Management

#### todoist_create_task
Create new tasks with various attributes:
* Required: content (task title)
* Optional: description, due date, priority level (1-4), project, labels, section
* Example: "Create task 'Team Meeting' with description 'Weekly sync' due tomorrow with label 'work'"

#### todoist_get_tasks
Retrieve and filter tasks:
* Filter by due date, priority, or project
* Natural language date filtering
* Optional result limit
* Example: "Show high priority tasks due this week"

#### todoist_update_task
Update existing tasks using natural language search:
* Find tasks by partial name match
* Update any task attribute (content, description, due date, priority)
* Example: "Update meeting task to be due next Monday"

#### todoist_complete_task
Mark tasks as complete using natural language search:
* Find tasks by partial name match
* Confirm completion status
* Example: "Mark the documentation task as complete"

#### todoist_reopen_task
Reopen completed tasks:
* Find completed tasks by name
* Restore them to active status
* Example: "Reopen the budget review task"

#### todoist_delete_task
Remove tasks using natural language search:
* Find and delete tasks by name
* Confirmation messages
* Example: "Delete the PR review task"

#### todoist_add_comment
Add comments to tasks:
* Find task by name and add a note
* Track discussions and additional details
* Example: "Add comment 'Waiting for client feedback' to proposal task"

### Project Management

#### todoist_get_projects
List all projects:
* View all available projects
* Shows project names and IDs
* Example: "Show all my projects"

#### todoist_create_project
Create new projects:
* Set project name
* Optional: color, favorite status
* Example: "Create project 'Q1 Goals' as favorite"

### Organization

#### todoist_get_labels
View all personal labels:
* List existing labels
* Shows label names and IDs
* Example: "Show all my labels"

#### todoist_create_label
Create new labels:
* Set label name
* Optional: color
* Example: "Create label 'urgent' with red color"

#### todoist_get_sections
View project sections:
* List sections by project
* Shows section organization
* Example: "Get sections for project 123"

#### todoist_create_section
Create sections in projects:
* Organize tasks within projects
* Required: section name and project ID
* Example: "Create section 'In Progress' in project 456"

## Setup

### Getting a Todoist API Token
1. Log in to your Todoist account
2. Navigate to Settings → Integrations
3. Find your API token under "Developer"

### Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "todoist": {
      "command": "npx",
      "args": ["-y", "@abhiz123/todoist-mcp-server"],
      "env": {
        "TODOIST_API_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

## Example Usage

### Creating Tasks
```
"Create task 'Team Meeting'"
"Add task 'Review PR' due tomorrow at 2pm"
"Create high priority task 'Fix bug' with description 'Critical performance issue'"
"Create task 'Design Review' in project 'Product Development' with label 'design'"
"Add task 'Code review' to section 'In Progress' with labels 'dev' and 'urgent'"
```

### Getting Tasks
```
"Show all my tasks"
"List tasks due today"
"Get high priority tasks"
"Show tasks due this week"
"Show tasks in project 'Work'"
```

### Updating Tasks
```
"Update documentation task to be due next week"
"Change priority of bug fix task to urgent"
"Add description to team meeting task"
```

### Completing and Reopening Tasks
```
"Mark the PR review task as complete"
"Complete the documentation task"
"Reopen the budget planning task"
```

### Deleting Tasks
```
"Delete the PR review task"
"Remove meeting prep task"
```

### Managing Projects
```
"Show all my projects"
"Create project 'Q1 Marketing' as favorite"
"Create project 'Personal Goals' with color blue"
```

### Managing Labels
```
"Show all my labels"
"Create label 'urgent' with red color"
"Create label 'personal'"
```

### Managing Sections
```
"Get sections for project 'Product Development'"
"Create section 'Backlog' in project 123"
"Create section 'Done' in project 456"
```

### Adding Comments
```
"Add comment 'Meeting rescheduled to Friday' to team sync task"
"Add comment 'Waiting for approval' to budget task"
```

## Development

### Building from source
```bash
# Clone the repository
git clone https://github.com/abhiz123/todoist-mcp-server.git

# Navigate to directory
cd todoist-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

## Contributing
Contributions are welcome! Feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Issues and Support
If you encounter any issues or need support, please file an issue on the [GitHub repository](https://github.com/abhiz123/todoist-mcp-server/issues).