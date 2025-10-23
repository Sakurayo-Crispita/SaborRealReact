import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

BASE_URL = os.getenv("BASE_URL", "http://localhost:5173/")

def wait_localstorage_token(driver, timeout=15):
    end = time.time() + timeout
    while time.time() < end:
        try:
            token = driver.execute_script("return window.localStorage.getItem('token')")
            if token:
                return True
        except Exception:
            pass
        time.sleep(0.3)
    return False

def test_catalogo_filtrar_y_login():
    opts = Options()
    # opts.add_argument("--headless=new")  # déjalo visible mientras debugueas
    opts.add_argument("--start-maximized")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-gpu")

    os.makedirs("evidencias", exist_ok=True)

    driver = webdriver.Chrome(options=opts)
    driver.set_window_size(1280, 900)

    try:
        print(f"[TEST] Abriendo: {BASE_URL}")
        driver.get(BASE_URL)

        # 1) Esperar a que cargue el catálogo
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "h1"))
        )

        # 2) Filtrar por "Pan"
        sel = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "select"))
        )
        Select(sel).select_by_value("pan")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "article"))
        )

        # 3) Login
        email = driver.find_element(By.CSS_SELECTOR, 'input[placeholder="email"]')
        pwd   = driver.find_element(By.CSS_SELECTOR, 'input[placeholder="password"]')
        btn   = driver.find_element(By.XPATH, "//button[normalize-space()='Ingresar']")
        email.clear(); email.send_keys("demo@saborreal.com")
        pwd.clear();   pwd.send_keys("demo123")
        btn.click()

        # 4) Espera robusta: token en localStorage
        ok = wait_localstorage_token(driver, timeout=15)

        # 5) Alternativa: mensaje visible
        if not ok:
            try:
                WebDriverWait(driver, 5).until(
                    EC.text_to_be_present_in_element((By.TAG_NAME, "body"), "Sesión")
                )
                ok = True
            except TimeoutException:
                ok = False

        assert ok, "No se detectó login (ni token en localStorage ni mensaje de éxito)."

        # Evidencia de éxito
        driver.save_screenshot(f"evidencias/selenium_ok_{int(time.time())}.png")

    except Exception:
        # Evidencia de fallo
        driver.save_screenshot("evidencias/selenium_fail.png")
        raise
    finally:
        driver.quit()

if __name__ == "__main__":
    try:
        test_catalogo_filtrar_y_login()
        print("[OK] Selenium E2E pasó sin errores ✅")
    except Exception as e:
        print("[FAIL] Selenium E2E falló:", e)
        raise