import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def verify_scroll_stability():
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--window-size=1024,768')
    
    print("Starting browser...")
    driver = webdriver.Chrome(options=options)
    
    try:
        print("Navigating to http://localhost:8081...")
        driver.get('http://localhost:8081')
        
        # Wait for login inputs
        wait = WebDriverWait(driver, 10)
        email_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'input[type="email"]')))
        password_input = driver.find_element(By.CSS_SELECTOR, 'input[type="password"]')
        
        print("Logging in...")
        email_input.send_keys('sanjay.krishna@attmate.com')
        password_input.send_keys('123')
        
        # Find and click Sign In button (the one without 'Forgot password?' text)
        buttons = driver.find_elements(By.CSS_SELECTOR, 'div[role="button"]')
        for btn in buttons:
            if 'Sign In' in btn.text:
                btn.click()
                break
                
        time.sleep(3) # Wait for TeacherHome to load
        
        # Measure initial viewport and body height
        initial_body_height = driver.execute_script("return document.body.scrollHeight")
        initial_window_height = driver.execute_script("return window.innerHeight")
        
        print(f"Initial - Window Height: {initial_window_height}, Body Height: {initial_body_height}")
        
        # Attempt to scroll the main page (this shouldn't change body height anymore)
        print("Attempting window scroll...")
        driver.execute_script("window.scrollBy(0, 500)")
        time.sleep(1)
        
        post_scroll_body_height = driver.execute_script("return document.body.scrollHeight")
        print(f"Post Window Scroll - Body Height: {post_scroll_body_height}")
        
        if post_scroll_body_height == initial_window_height:
            print("SUCCESS: Body height matches window height. No layout thrashing detected globally.")
        else:
            print(f"WARNING: Body height ({post_scroll_body_height}) differs from window height ({initial_window_height}). Jitter possible.")
            
        print("Test complete.")
        
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    verify_scroll_stability()
