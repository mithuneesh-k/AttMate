import time
import os
import sys

# Ensure selenium is available, if not install it
os.system(f"{sys.executable} -m pip install selenium")

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def dump_dom():
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
        
        buttons = driver.find_elements(By.CSS_SELECTOR, 'div[role="button"]')
        for btn in buttons:
            if 'Sign In' in btn.text:
                btn.click()
                break
                
        time.sleep(4) # Wait for TeacherHome to load
        
        print("Dumping DOM...")
        html_content = driver.page_source
        
        with open('dom_dump.html', 'w', encoding='utf-8') as f:
            f.write(html_content)
            
        print("DOM dumped to dom_dump.html")
        
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    dump_dom()
