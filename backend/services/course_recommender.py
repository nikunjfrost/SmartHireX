def get_course_recommendations(missing_skills):
    """
    Given a list of missing skills, returns a list of recommended Coursera courses.
    """
    course_catalog = {
        "react": {
            "title": "Meta Front-End Developer Professional Certificate",
            "provider": "Meta",
            "link": "https://www.coursera.org/professional-certificates/meta-front-end-developer",
            "level": "Beginner"
        },
        "python": {
            "title": "Python for Everybody Specialization",
            "provider": "University of Michigan",
            "link": "https://www.coursera.org/specializations/python",
            "level": "Beginner"
        },
        "aws": {
            "title": "AWS Cloud Solutions Architect Professional Certificate",
            "provider": "AWS",
            "link": "https://www.coursera.org/professional-certificates/aws-cloud-solutions-architect",
            "level": "Intermediate"
        },
        "data science": {
            "title": "IBM Data Science Professional Certificate",
            "provider": "IBM",
            "link": "https://www.coursera.org/professional-certificates/ibm-data-science",
            "level": "Beginner"
        },
        "figma": {
            "title": "Google UX Design Professional Certificate",
            "provider": "Google",
            "link": "https://www.coursera.org/professional-certificates/google-ux-design",
            "level": "Beginner"
        },
        "kubernetes": {
            "title": "Architecting with Google Kubernetes Engine Specialization",
            "provider": "Google Cloud",
            "link": "https://www.coursera.org/specializations/architecting-google-kubernetes-engine",
            "level": "Intermediate"
        },
        "sql": {
            "title": "Learn SQL Basics for Data Science Specialization",
            "provider": "UC Davis",
            "link": "https://www.coursera.org/specializations/learn-sql-basics-data-science",
            "level": "Beginner"
        },
        "machine learning": {
            "title": "Machine Learning Specialization",
            "provider": "DeepLearning.AI",
            "link": "https://www.coursera.org/specializations/machine-learning-introduction",
            "level": "Intermediate"
        },
        "javascript": {
            "title": "Programming with JavaScript",
            "provider": "Meta",
            "link": "https://www.coursera.org/learn/programming-with-javascript",
            "level": "Beginner"
        },
        "docker": {
            "title": "Docker for Absolute Beginners",
            "provider": "Coursera Project Network",
            "link": "https://www.coursera.org/projects/docker-for-absolute-beginners",
            "level": "Beginner"
        },
        "java": {
            "title": "Object Oriented Programming in Java Specialization",
            "provider": "UC San Diego",
            "link": "https://www.coursera.org/specializations/object-oriented-programming",
            "level": "Intermediate"
        },
        "c++": {
            "title": "C++ for C Programmers",
            "provider": "UC Santa Cruz",
            "link": "https://www.coursera.org/learn/c-plus-plus-a",
            "level": "Intermediate"
        }
    }

    recommendations = []
    seen_links = set()

    for skill in missing_skills:
        skill_lower = skill.lower()
        matched = False
        for key, course in course_catalog.items():
            if key in skill_lower and course["link"] not in seen_links:
                rec = course.copy()
                rec["skill"] = skill
                recommendations.append(rec)
                seen_links.add(course["link"])
                matched = True
                break
        
        # If no specific match found, generate a dynamic Coursera search link
        if not matched:
            dynamic_link = f"https://www.coursera.org/search?query={skill}"
            if dynamic_link not in seen_links:
                recommendations.append({
                    "title": f"Explore top courses for {skill}",
                    "provider": "Coursera",
                    "link": dynamic_link,
                    "level": "All Levels",
                    "skill": skill
                })
                seen_links.add(dynamic_link)

    return recommendations[:]  # Limit to top 5 recommendations to keep UI clean
