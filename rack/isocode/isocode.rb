
module Rack
    class Isocode
        def initialize(app)
            @app = app
            # @jsapp = config.isocode.jsapp # path to js app file
        end

        def call(env)
            response = @app.call(env)
            # TODO response.body = isocode(response.body, @jsapp)
        end
    end
end

