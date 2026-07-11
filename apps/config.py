HOSTNAME = '192.168.0.241'  # 数据库地址
PORT = '23306'  # 端口号
DATABASE = 'blog'  # 数据库名称
USERNAME = 'blog'  # 用户名
PASSWORD = "blog"  # 密码
DB_URI = 'mysql+pymysql://%s:%s@%s:%s/%s?charset=utf8mb4' % (USERNAME, PASSWORD, HOSTNAME, PORT, DATABASE)
print(DB_URI)
SQLALCHEMY_DATABASE_URI = DB_URI  # 设置数据库连接  用于连接的数据库URI
SQLALCHEMY_TRACK_MODIFICATIONS = True  # 禁止对象追踪修改 设置为True，不然会报增加显著开销的错误。
