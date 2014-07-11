from flask import Blueprint, jsonify, render_template, request
import supervisor.xmlrpc
import xmlrpclib

bg = xmlrpclib.ServerProxy('http://127.0.0.1', transport=supervisor.xmlrpc.SupervisorTransport(
    None, None,'unix:///var/run/supervisor.sock'))

editor = Blueprint('background', __name__, template_folder='templates')

@editor.route('/editor/background/add/<scriptname>', methods=['GET', 'POST'])
def add():
    # write config file in /etc/supervisor/conf.d
    conffile = '/etc/supervisor/conf.d/' + scriptname + '.conf'
    with open(conffile, 'w') as f:
        f.write('[program:' + scriptname + ']')
        f.write('command=/var/www/public/background/' + scriptname + '.py')
        f.write('autostart=true')
        f.close()

@editor.route('/editor/background/status', methods=['GET', 'POST'])
def allstatus():
    d = bg.supervisor.getAllProcessInfo()
    return jsonify(**d)

@editor.route('/editor/background/status/<scriptname>', methods=['GET', 'POST'])
def status(scriptname):
    d = bg.supervisor.getProcessInfo(scriptname)
    return jsonify(**d)

@editor.route('/editor/background/start/<scriptname>', methods=['GET', 'POST'])
def start(scriptname):
    result = bg.supervisor.startProcess(scriptname)
    return (result, 200)

@editor.route('/editor/background/stop/<scriptname>', methods=['GET', 'POST'])
def stop(scriptname):
    result = bg.supervisor.stopProcess(scriptname)
    return (result, 200)
