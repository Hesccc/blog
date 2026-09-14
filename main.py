import os
from apps import create_apps

app = create_apps()

if __name__ == '__main__':
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', '5000'))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    app.run(debug=debug, host=host, port=port)
