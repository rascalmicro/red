from flask import Blueprint, json, jsonify, render_template, request
import os
from subprocess import call
import supervisor.xmlrpc
import xmlrpclib

bg = xmlrpclib.ServerProxy('http://127.0.0.1', transport=supervisor.xmlrpc.SupervisorTransport(
    None, None,'unix:///var/run/supervisor.sock'))

editor = Blueprint('background', __name__, template_folder='templates')

@editor.route('/editor/background', methods=['GET', 'POST'])
def background():
    return render_template('background-scripts.html')

@editor.route('/editor/background/add/<scriptname>', methods=['GET', 'POST'])
def add(scriptname):
    # write config file in /etc/supervisor/conf.d
    conffile = '/etc/supervisor/conf.d/' + scriptname + '.conf'
    scriptfile = '/var/www/public/background/' + scriptname + '.py'
    if not os.path.exists(scriptfile):
        with open(scriptfile, 'w') as s:
            s.write('# This is an empty Python file created just for you.')
            s.close()
        os.chmod(scriptfile, 0744) # Mark file executable
    if not os.path.exists(conffile):
        with open(conffile, 'w') as f:
            f.write('[program:' + scriptname + ']\n')
            f.write('command=' + scriptfile + '\n')
            f.write('autostart=true\n')
            f.close()
        call(["supervisorctl", "update"])
        return jsonify(result=0, msg='Script ' + scriptname + ' added as a background process.')
    else:
        return jsonify(result=1, msg='The script ' + scriptname + ' is already configured, so no changes were made.')

@editor.route('/editor/background/status', methods=['GET', 'POST'])
def allstatus():
    d = bg.supervisor.getAllProcessInfo()
    print d
    return json.dumps(d)

@editor.route('/editor/background/status/<scriptname>', methods=['GET', 'POST'])
def status(scriptname):
    d = bg.supervisor.getProcessInfo(scriptname)
    # Needs error checking
    return jsonify(**d)

@editor.route('/editor/background/start/<scriptname>', methods=['GET', 'POST'])
def start(scriptname):
    result = bg.supervisor.startProcess(scriptname)
    return (result, 200)

@editor.route('/editor/background/stop/<scriptname>', methods=['GET', 'POST'])
def stop(scriptname):
    result = bg.supervisor.stopProcess(scriptname)
    return (result, 200)