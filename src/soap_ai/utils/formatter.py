def validate_soap(text):
    required = ["Subjective:", "Objective:", "Assessment:", "Plan:"]
    return all(r in text for r in required)