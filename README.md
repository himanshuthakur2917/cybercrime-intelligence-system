# Attack Chain Tracer

## Overview
The Attack Chain Tracer is a Next.js application designed to find communication and money-flow paths between criminals using graph traversal algorithms. It utilizes Breadth-First Search (BFS) and Depth-First Search (DFS) to analyze connections between suspects and visualize the results.

## Features
- Visualize suspect connections in a graph format.
- Use BFS and DFS algorithms to trace paths between suspects.
- Connect to a Supabase database for data storage and retrieval.
- User-friendly interface for inputting suspects and viewing results.

## Technologies Used
- Next.js: A React framework for building server-rendered applications.
- TypeScript: A superset of JavaScript that adds static types.
- Supabase: An open-source Firebase alternative for database management.
- Tailwind CSS: A utility-first CSS framework for styling.

## Project Structure
```
attack-chain-tracer
├── public                # Static assets
├── src
│   ├── components        # React components
│   ├── pages             # Application pages
│   ├── styles            # CSS styles
│   ├── utils             # Utility functions (BFS, DFS, Supabase client)
│   └── types             # TypeScript types and interfaces
├── .env.local            # Environment variables
├── .gitignore            # Git ignore file
├── next.config.js        # Next.js configuration
├── package.json          # NPM dependencies
├── tsconfig.json         # TypeScript configuration
└── README.md             # Project documentation
```

## Setup Instructions
1. Clone the repository:
   ```
   git clone <repository-url>
   cd attack-chain-tracer
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000` to view the application.

## Usage
- Navigate to the tracer page to input suspects and initiate the tracing process.
- View the visual representation of the suspect graph and the paths identified by the algorithms.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.