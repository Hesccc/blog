from apps import create_apps

app = create_apps()

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)


