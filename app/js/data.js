const DB = {
  user: null, // Set on login
  posts: [
    {
      id: 1,
      name: "Sarah Jenkins",
      role: "Design • NIFT",
      time: "2h ago",
      text: "Just shipped my new portfolio! 🎨",
      image:
        "https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=800&q=80",
      likes: 42,
    },
    {
      id: 2,
      name: "Arjun Patel",
      role: "CS • IITB",
      time: "5h ago",
      text: "Hackathon winners! 🏆 48 hours of code.",
      image:
        "https://images.unsplash.com/photo-1504384308090-c54be385299d?auto=format&fit=crop&w=800&q=80",
      likes: 128,
    },
    {
      id: 3,
      name: "Priya Sharma",
      role: "MBA • IIM",
      time: "1d ago",
      text: "Internship season started. Good luck everyone!",
      image: null,
      likes: 89,
    },
  ],
  profiles: [
    {
      id: 101,
      name: "David Kim",
      uni: "MIT",
      major: "CS",
      year: "3rd",
      ei: 940,
      skills: ["React", "Node", "AI"],
      color: "#7b8f6e",
    },
    {
      id: 102,
      name: "Elena R.",
      uni: "Stanford",
      major: "Biz",
      year: "4th",
      ei: 890,
      skills: ["Marketing", "Strategy"],
      color: "#c1d0b5",
    },
    {
      id: 103,
      name: "Rohan G.",
      uni: "BITS",
      major: "EEE",
      year: "2nd",
      ei: 910,
      skills: ["IoT", "C++"],
      color: "#6e7e65",
    },
  ],
};
