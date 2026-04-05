import Movie from '../models/Movie.js';
import connectDB from '../config/database.js';

// Sample movie data with reliable working URLs
const sampleMovies = [
  {
    title: "Big Buck Bunny",
    description: "A charming animated short film about a large and lovable rabbit who is forced to defend his friends from a group of rodent bullies.",
    thumbnail: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/330px-Big_buck_bunny_poster_big.jpg",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    genre: ["Animation", "Comedy"],
    rating: 7.8,
    year: 2008,
    duration: 10,
    cast: ["Blender Foundation"],
    director: "Sacha Goedegebure",
    featured: true,
    trending: false,
    topRated: true
  },
  {
    title: "Sample Action Movie",
    description: "An exciting action-packed adventure with stunning visual effects and thrilling sequences.",
    thumbnail: "https://via.placeholder.com/400x600/1a1a1a/e50914?text=ACTION+MOVIE",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    genre: ["Action", "Adventure"],
    rating: 8.1,
    year: 2023,
    duration: 120,
    cast: ["Action Hero", "Supporting Actor"],
    director: "Action Director",
    featured: true,
    trending: true,
    topRated: true
  },
  {
    title: "Comedy Central",
    description: "A hilarious comedy that will keep you laughing from start to finish with brilliant performances.",
    thumbnail: "https://via.placeholder.com/400x600/2d2d2d/e50914?text=COMEDY+MOVIE",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_720x480_1mb.mp4",
    genre: ["Comedy", "Family"],
    rating: 7.5,
    year: 2023,
    duration: 95,
    cast: ["Funny Actor", "Comedy Star"],
    director: "Comedy Genius",
    featured: false,
    trending: true,
    topRated: false
  },
  {
    title: "Sci-Fi Thriller",
    description: "A mind-bending science fiction thriller that explores the boundaries of reality and imagination.",
    thumbnail: "https://via.placeholder.com/400x600/0a0a0a/e50914?text=SCI-FI+MOVIE",
    videoUrl: "https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4",
    genre: ["Sci-Fi", "Thriller"],
    rating: 8.7,
    year: 2024,
    duration: 135,
    cast: ["Sci-Fi Star", "Future Hero"],
    director: "Visionary Director",
    featured: true,
    trending: false,
    topRated: true
  },
  {
    title: "Drama Masterpiece",
    description: "An emotional journey that touches the heart and soul with powerful storytelling and incredible acting.",
    thumbnail: "https://via.placeholder.com/400x600/3d3d3d/e50914?text=DRAMA+MOVIE",
    videoUrl: "https://file-examples.com/storage/fe68f42d05bb0412222240a/2017/10/file_example_MP4_480_1_5MG.mp4",
    genre: ["Drama", "Romance"],
    rating: 9.1,
    year: 2024,
    duration: 150,
    cast: ["Drama Queen", "Method Actor"],
    director: "Award Winner",
    featured: false,
    trending: true,
    topRated: true
  }
];

async function seedDatabase() {
  try {
    await connectDB();
    console.log('🌱 Starting database seeding...');
    
    // Check if movies already exist
    const existingMovies = await Movie.countDocuments();
    if (existingMovies > 0) {
      console.log(`📚 Database already has ${existingMovies} movies. Skipping seed.`);
      process.exit(0);
    }
    
    // Insert sample movies
    const createdMovies = await Movie.insertMany(sampleMovies);
    console.log(`✅ Successfully seeded ${createdMovies.length} movies to the database!`);
    
    console.log('🎬 Sample movies added:');
    createdMovies.forEach(movie => {
      console.log(`  - ${movie.title} (${movie.year})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;