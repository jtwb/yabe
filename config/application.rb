
class ExampleApplication < Rails::Application
    config.middleware.use Rack::Isocode
end

