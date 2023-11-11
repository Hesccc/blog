from flask import Blueprint, render_template
from ..models import *

blue_blog = Blueprint("blue_blog", __name__)

@blue_blog.route('/read', methods=['GET', 'POST'])
def read():
    return render_template("post.html")