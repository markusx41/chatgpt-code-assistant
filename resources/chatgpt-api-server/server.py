"""Make some requests to OpenAI's chatbot"""

import time
import os
import flask

from flask import g

from playwright.sync_api import sync_playwright

APP = flask.Flask(__name__)
PLAY = sync_playwright().start()
BROWSER = PLAY.chromium.launch_persistent_context(
    user_data_dir="/tmp/playwright",
    headless=False,
)
PAGE = BROWSER.new_page()

def get_input_box():
    """Get the child textarea of `PromptTextarea__TextareaWrapper`"""
    return PAGE.query_selector("textarea")

def is_logged_in():
    # See if we have a textarea with data-id="root"
    return get_input_box() is not None

def send_message(message):
    # Send the message
    box = get_input_box()
    box.click()
    box.fill(message)
    box.press("Enter")

def chat_incomplete():
    """Get the latest message"""
    x_path = '#__next > div > div > main > div > form > div > div > button'
    buttonz = PAGE.query_selector(x_path)
    return not buttonz.inner_text().__contains__("Try again")
    
def get_last_message():
    """Get the latest message"""
    page_elements = PAGE.query_selector_all("#__next > div > div > main > div > div > div > div > div > div")
    last_element = page_elements[-1]
    return last_element.inner_html()

@APP.route("/chat", methods=["GET"])
def chat():
    message = flask.request.args.get("q")
    print("Sending message: ", message)
    send_message(message)

    i = 0
    while chat_incomplete():
        print(".")
        i += 1;
        if i > 100:
            break
        time.sleep(1)
    response = get_last_message()
    print("Response: ", response)
    PAGE.reload() # needed otherwise the next query will not wait for an answer
    return response

def start_browser():
    PAGE.goto("https://chat.openai.com/")
    if not is_logged_in():
        print("Please log in to OpenAI Chat")
        print("Press enter when you're done")
        input()
    
    APP.run(port=5001, threaded=False)

if __name__ == "__main__":
    start_browser()
