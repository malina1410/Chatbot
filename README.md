# OdinX – Real-Time Chatbot Application

OdinX is a full-stack chatbot application built using **React** and **Django**, designed to demonstrate authentication, real-time communication using WebSockets, persistent chat history, and AI-powered responses.  
The project was developed as part of an academic task to implement a modern chatbot system using **REST APIs and WebSockets**.

---

## 📌 Project Objective

The goal of this project is to:

- Implement secure user authentication using Django sessions
- Build a real-time chat interface using WebSockets
- Maintain multiple chat conversations per user
- Store and retrieve chat history using REST APIs
- Integrate an AI model to generate chatbot responses
- Create a clean and interactive frontend experience

---

## ✨ Features

### 🔐 Authentication
- Session-based authentication using Django’s built-in session engine
- Custom **Signup (Identity Creation)** page
- Login validation handled by the backend
- Authenticated routes protected on the frontend

---
### 🔐 Security Measures

- Session-based authentication using Django’s secure session engine
- CSRF protection enabled for all REST state-changing operations
  (e.g., renaming or deleting chat sessions)
- WebSocket connections require an authenticated user during the handshake phase
- Unauthorized users cannot establish or reuse WebSocket connections


---
### 💬 Chat System
- Real-time messaging using **WebSockets**
- Users can create and manage multiple chat sessions
- Each chat has a unique `session_id`
- Chat history is persistent and stored in the database
- Sidebar lists all previous chats with AI-generated titles

---

### 🧠 AI Integration
- Chatbot responses are generated using **Google Gemini 2.0 Flash**
- For every message:
  - The last **20 messages** of the active session are used as context
  - Responses are generated inside the WebSocket consumer
- A global system instruction defining the "OdinX" persona is hardcoded in `ai_utils.py`
- This ensures a consistent assistant behavior across all chat sessions
- Chat titles are automatically generated from the first user prompt
- While only the most recent 20 messages are used for AI context,
  the backend reverses the query result to maintain correct chronological order
  (Oldest → Newest) before sending it to the model



---

### 🎨 Frontend Experience
- Interactive chat window with:
  - Real-time update
  - Typing / streaming animation for AI responses
- Markdown rendering with full syntax highlighting for 20+ programming languages
  using React Markdown and Prism.js
- User feedback loops implemented through custom success toasts during signup,
  followed by automated redirection to the login flow
- Frontend-level form validation for required fields and password confirmation,
  reducing unnecessary backend requests and improving user experience
- Developer-friendly code block formatting with theme-based highlighting

- Sidebar for chat navigation
- Clean, responsive UI built with Tailwind CSS

---
### 🎨 UI Design
- Glassmorphism-based UI using backdrop blur and transparency
- Custom radial gradient background for a modern, layered visual effect

---
## 🏗 System Architecture Overview

### High-Level Flow

1. User logs in or signs up via REST API  
2. After authentication:
   - Frontend establishes a **WebSocket connection**
3. User sends a message:
   - Message is transmitted via WebSocket
   - Backend stores it in the database
4. AI response is generated and streamed back
5. Messages are saved and displayed in real time
6. Chat history is fetched via REST when switching sessions

**Message Lifecycle:**

```
→ User Input  
→ WebSocket Emit  
→ Database Persistence  
→ Context Retrieval (Session-Filtered History)  
→ Gemini API Call  
→ AI Response Persistence  
→ WebSocket Broadcast  
→ UI Streaming Update
```
---
### State Management & Active Session Sync

- The application maintains the currently active chat session using React’s
  `useState` and `useEffect` hooks
- When a user selects a chat from the sidebar, the active session ID is updated
  and synchronized with the WebSocket consumer
- This ensures the UI, WebSocket stream, and message history always remain
  aligned with the selected chat session

---
### ⚡ Performance & Stability

- WebSocket rate limiting enforced at the consumer level
- Users are limited to one message every 0.5 seconds
- Prevents API abuse and ensures stable performance under concurrent usage
---
### Context Isolation & Session Safety

To prevent cross-session data leakage, the backend enforces strict context isolation:

- For every AI request, message history is filtered using the ChatSession primary key
- Only messages belonging to the active session are ever passed to the AI model
- This ensures that conversations remain fully isolated (Chat A cannot influence Chat B)

---

## 🔄 REST API vs WebSockets

| Functionality | Technology Used |
|---------------|-----------------|
| Login / Signup | REST API |
| Fetch chat sessions | REST API |
| Fetch message history | REST API |
| Send & receive chat messages | WebSockets |

This separation ensures:
- Stateless data fetching via REST
- Low-latency real-time messaging via WebSockets


This hybrid architecture was intentionally chosen: REST APIs handle stateless
and data-heavy operations such as authentication and chat history retrieval,
while WebSockets manage low-latency, stateful interactions during live chatting.
This approach optimizes both server efficiency and real-time user experience.

---

## 🛠 Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router v6
- react-use-websocket
- React Markdown
- Prism.js (syntax highlighting)

### Backend
- Django 5.x
- Django REST Framework
- Django Channels 4.x
- Daphne (ASGI server)

### AI
- Google Gemini 2.0 Flash
- `google-generativeai` SDK

### Database
- SQLite (local development)

---

## 🧩 Database Models (Overview)

### User
- Django’s built-in authentication model

### ChatSession
- Owner (User)
- Title
- Session ID (Primary Key `id`)

### Message
- Linked ChatSession
- Sender (User / AI)
- Message content
- Timestamp

---

## 📂 Project Structure

```plaintext
OdinX/
├── backend/
│   ├── chat/
│   │   ├── consumers.py        # WebSocket chat logic
│   │   ├── ai_utils.py         # Gemini API integration
│   │   ├── models.py           # ChatSession & Message models
│   │   └── views.py            # REST APIs for sessions & history
│   ├── core/
│   │   ├── asgi.py             # Channels configuration
│   │   └── urls.py
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/         # Chat, Sidebar, Login, Signup
│   │   ├── context/            # Authentication state
│   │   ├── pages/
│   │   └── App.jsx
│   └── index.html
└── .env
```
## ▶️ Running the Project Locally

### Backend
```bash
cd backend
python manage.py migrate
python manage.py runserver
```
> **Note:** For local development, `python manage.py runserver` automatically
> handles both WSGI and ASGI configurations and supports Django Channels.
> In production, **Daphne** is used as the dedicated ASGI server for
> production-grade asynchronous WebSocket handling.


### Frontend
```bash
cd frontend
npm install
npm run dev
```
Access URLs:
 - Backend: http://localhost:8000
 - Frontend: http://localhost:5173

### 🚀 Future Enhancements
 -   Redis for WebSocket scaling
 -   PostgreSQL for production database
 -   File and image uploads in chat
 -   Export chat history (PDF / Markdown)
 -   Deployment using Docker

### 📌 Summary
OdinX demonstrates a complete real-time chatbot architecture using React, Django, REST APIs, and WebSockets.
The project focuses on correct system design, real-time data flow, and clean separation of concerns, making it suitable for academic evaluation and technical interviews.