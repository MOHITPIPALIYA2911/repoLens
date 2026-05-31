def generate_interview_talking_points(features: dict, scores: dict) -> list[str]:
    repo_name = features.get("repo_name") or "this project"
    description = features.get("description")
    main_language = features.get("main_language")
    languages = features.get("languages") or []
    topics = features.get("topics") or []

    points = []

    if description:
        points.append(
            f"Explain the real-world problem solved by {repo_name} and why that problem matters."
        )
    else:
        points.append(
            f"Explain the purpose of {repo_name}, because the repository description is currently missing."
        )

    if main_language:
        points.append(
            f"Explain why you used {main_language} as the main technology and what trade-offs it gave you."
        )

    if len(languages) > 1:
        language_list = ", ".join(languages[:4])
        points.append(
            f"Explain how different technologies are connected in this project: {language_list}."
        )

    if topics:
        topic_list = ", ".join(topics[:4])
        points.append(
            f"Connect this project with these technical areas during interview discussion: {topic_list}."
        )

    if features.get("has_api_docs"):
        points.append(
            "Explain the API design, important endpoints, request/response flow, and how errors are handled."
        )

    if features.get("has_live_demo"):
        points.append(
            "Use the live demo to explain the user flow, core features, and what happens behind the scenes."
        )
    else:
        points.append(
            "Explain how you would deploy this project and what changes are needed before making it public."
        )

    if features.get("has_tests"):
        points.append(
            "Explain your testing strategy, what parts are tested, and why those tests are important."
        )
    else:
        points.append(
            "Be ready to explain how you would add tests and which modules you would test first."
        )

    if features.get("has_dockerfile"):
        points.append(
            "Explain how Docker helps run this project consistently across different systems."
        )

    if features.get("has_ci_cd"):
        points.append(
            "Explain the CI/CD workflow and how it improves project quality before deployment."
        )

    if features.get("has_dockerfile") is False and features.get("has_ci_cd") is False:
        points.append(
            "Explain what production-readiness improvements you would add next, such as Docker, CI/CD, and environment config."
        )

    if scores.get("documentation", 0) < 60:
        points.append(
            "Be prepared to explain the project clearly yourself, because the README documentation is currently weak."
        )

    if scores.get("production_readiness", 0) < 50:
        points.append(
            "Explain what is missing for production use and how you would make the project more reliable."
        )

    if scores.get("activity", 0) < 50:
        points.append(
            "Explain whether this project is still maintained and what recent improvement you would make first."
        )

    # Remove duplicates while keeping order
    unique_points = []
    for point in points:
        if point not in unique_points:
            unique_points.append(point)

    return unique_points[:5]


def generate_repo_review(features: dict, scores: dict) -> dict:
    strengths = []
    weaknesses = []
    red_flags = []
    improvement_plan = []

    if features["has_readme"]:
        strengths.append("Repository has a README file.")
    else:
        weaknesses.append("README file is missing.")
        red_flags.append("Recruiters may not understand the project quickly.")
        improvement_plan.append(
            "Add a strong README with project purpose, setup steps, screenshots, and tech stack."
        )

    if features["has_setup_guide"]:
        strengths.append("README includes setup or usage instructions.")
    else:
        weaknesses.append("Setup or usage instructions are missing.")
        improvement_plan.append("Add clear installation and run instructions.")

    if features["has_screenshots"]:
        strengths.append("Project presentation includes screenshots or visual proof.")
    else:
        weaknesses.append("No screenshots found.")
        improvement_plan.append("Add screenshots or GIFs showing the project output.")

    if features["has_live_demo"]:
        strengths.append("Repository appears to include a live demo link.")
    else:
        weaknesses.append("No live demo link found.")
        improvement_plan.append("Deploy the project and add the live demo link in README.")

    if features["has_tests"]:
        strengths.append("Test files are present.")
    else:
        weaknesses.append("No test files detected.")
        red_flags.append("Project may look less production-ready without tests.")
        improvement_plan.append("Add basic unit tests or integration tests.")

    if features["has_dockerfile"]:
        strengths.append("Dockerfile is present.")
    else:
        weaknesses.append("Dockerfile is missing.")
        improvement_plan.append("Add a Dockerfile to make the project easier to run.")

    if features["has_ci_cd"]:
        strengths.append("CI/CD workflow is configured.")
    else:
        weaknesses.append("CI/CD workflow not detected.")
        improvement_plan.append("Add GitHub Actions workflow for linting or testing.")

    if features["has_license"]:
        strengths.append("License file is present.")
    else:
        weaknesses.append("License file is missing.")
        improvement_plan.append("Add a license file to make usage rights clear.")

    if features["has_tech_stack"]:
        strengths.append("Tech stack is explained.")
    else:
        weaknesses.append("Tech stack section is missing.")
        improvement_plan.append("Add a Tech Stack section in README.")

    if features["days_since_push"] > 365:
        red_flags.append("Repository looks inactive for more than one year.")
        improvement_plan.append("Push an update or archive old unused projects.")

    if scores["overall"] >= 70:
        summary = "This repository has a good base and can be presented in interviews with some polishing."
    elif scores["overall"] >= 50:
        summary = "This repository shows effort, but it needs better presentation and production-readiness improvements."
    else:
        summary = "This repository may look weak to recruiters because important presentation and production signals are missing."

    interview_talking_points = generate_interview_talking_points(features, scores)

    return {
        "summary": summary,
        "strengths": strengths[:8],
        "weaknesses": weaknesses[:8],
        "red_flags": red_flags[:6],
        "improvement_plan": improvement_plan[:8],
        "interview_talking_points": interview_talking_points,
    }