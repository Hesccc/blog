from flask import Blueprint, render_template
from ..models import *

blue_index = Blueprint("blue_index", __name__)

@blue_index.route('/index')
@blue_index.route('/')
def index():
    return render_template("index.html")