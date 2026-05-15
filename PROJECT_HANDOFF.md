# Hackathon Platform Handoff

## Current Focus
Admin panel completion first. Do not jump to participant/judge UI unless needed for admin logic.

## Current Stable Admin Features
- Admin dashboard UI improvements
- Manage Hackathons UI/status badges improvements
- Hackathon Detail admin management summary with assigned judges, teams, projects, status
- Manage Projects/Teams filtering by hackathonId
- Manage Judges page with search and assignment
- Judge assignment from Manage Judges
- Judge assignment inside Edit Hackathon (syncs only on Save Changes)
- Rubric Builder inside Edit Hackathon (outside main form to avoid nested form issues)
- Rubric add/delete as separate server actions
- Judge access enforcement on review page and score submission
- Create/Edit Hackathon forms preserve values on validation failure
- Sticky bottom action bars on Create/Edit Hackathon
- Hackathon Detail fetches assigned judges from database
- Judge assignments are synced to judges table in database
- Rubric criteria are synced to rubric_criteria table in database

## Recent Fixes
- Users import fix in Hackathon Detail page
- JudgesRepository import fix in Hackathon Detail page
- Nested form fix: Rubric Builder moved outside main edit form
- createHackathonAction uses createdHackathon.id for redirect
- Admin Judges page removed dead Invite Judge button and added info note
- toLocaleDateString/toString use fixed locale in client components

## Current Known Limitations
- Real Supabase Auth invite judge flow not implemented yet
- PDF/problem statement upload not implemented yet; current final desired behavior is direct upload, not URL
- Full reference-level aesthetic still needs work across admin pages
- Add Judge / Invite Judge is currently foundation/disabled unless actual auth invite is implemented
- Need to ensure DB persistence is checked after every admin feature

## Next Recommended Admin Tasks
1. Real Invite Judge flow with Supabase Auth Admin API/service role OR manual judge profile creation flow
2. Problem statement PDF direct upload using Supabase Storage bucket/policies
3. Improve Admin Manage Hackathons/Projects/Teams/Judges UI to match reference aesthetic consistently
4. Add admin project moderation actions if schema supports it
5. Add admin team/member management if schema supports it
6. Add admin analytics/status counts with safe repository queries

## Manual Checks For Next Thread
- Hackathon Detail opens and refreshes without crash
- Edit Hackathon Save Changes works
- Judge checkbox changes save only after Save Changes
- Rubric add/delete works without nested form hydration error
- Create Hackathon works and redirects correctly
- Manage Judges opens without JSX syntax error
