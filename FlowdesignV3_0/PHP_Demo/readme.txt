
这是一个PHP示例，使用了Thinkphp3.2.3框架

在配置时，要以 wwwroot 为根目录，如下：

<VirtualHost *:80>
    ServerAdmin admin@admin.com
    DocumentRoot "D:\......\FlowdesignV3_0\PHP_Demo\wwwroot"
    ServerName dev.flowdesign.leipi.org
</VirtualHost>


配置文件：
	Application\Common\Conf
控制器：
	Application\Home\Controller
模板：
	Application\Home\View\Default