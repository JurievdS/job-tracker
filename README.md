# Job Tracker

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle-C5F74F?style=flat&logo=drizzle&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

A full-stack application to manage your job search workflow - track applications, companies, contacts, and stay on top of follow-ups.

## Features

- **Application Tracking** - Monitor applications through stages: bookmarked, pending, interview, offer, rejected
- **Company Database** - Store company details, ratings, and notes
- **Position Management** - Track job postings with salary ranges and requirements
- **Contact Network** - Keep records of recruiters and hiring managers
- **Interaction Log** - Record emails, calls, and interviews
- **Reminders** - Never miss a follow-up

## Project Structure

```
job-tracker/
├── backend/          # Express API server
├── frontend/         # (Coming soon)
└── docker-compose.yml
```

## Quick Start

```bash
# Start the database and API
docker compose up -d

# API available at http://localhost:3001
# Swagger docs at http://localhost:3001/docs
```

## Development

See individual READMEs for detailed setup:
- [Backend](./backend/README.md)

## License

MIT
